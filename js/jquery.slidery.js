//document.write('<div><h2>version 0.5.3</h2></div>');

/**
 * slider for SmartDevices
 * Specs
 *    - always loop slide
 *    - not slide-show
 */


var Slidery = function(_target, $, opts) {
  this.target = _target;

  this.duration = opts.duration || 300;
  this.easing = opts.easing || 'swing';
  //var arrowWidthRatio = opts.arrowWidthRatio || '0.1';
  //var arrowHeightRatio = opts.arrowHeightRatio || '0.4';

  // temporary initial additional-height (until window.loaded)
  this.initialAdditionalHeight = opts.initialAdditionalHeight || 0.5;

  this.thumbSize = opts.thumbSize || 60;

  this.flickBorder = 15;     // flick distance border
};

Slidery.prototype = {
  adjustSize: function(_height) {
    //TODO arrow-width should calc
    //var arrowWidth = Math.round(baseWidth * arrowWidthRatio);
    //$arrowLeft.css({width: arWidth}),
    //$arrowRight.css({width: arWidth});

    //TODO adjustWidth ??
    var listWidth = this.baseWidth;      // full-width
    this.leftMax = -listWidth * (this.listCount - 1);
    this.positionFirst = -listWidth;
    this.positionLast = -listWidth * (this.listCount - 2);

    this.$slider.css({width: listWidth, height: _height});
    this.$sFmain_li.css({width: listWidth});

    // slide to current item
    this.$sFmain_ul.css({left: -listWidth*this.currentIndex});

    this.isTouch = ('ontouchstart' in window);

    if (void 0 === _height) {
      this.adjustHeight();     // adjust height with each li-height
    }
  },

  adjustHeight: function() {
    var highest = 0;
    this.$sFmain_li.each(function() {
      var height = 0;
      $(this).children().each(function() {
        height += $(this).height();
      });
      if (highest < height) { highest = height; }
    });

    this.$sFmain_li.css({height: highest});
    this.$slider.css({height: highest, margin: 0});
    //$thumb.removeClass('hidden');
  },

  setStartIndex: function(e) {
    // flick started list-item
    var index = $(e.target).attr('data-index');
    if (void 0 === index) {
      index = $(e.target).parents('.slider-item').attr('data-index');
    }
    this.startIndex = parseInt(index);
  },

  _event: function(te, e) {
    return this.isTouch && te.changedTouches ? te.changedTouches[0] : e;
  },

  startSliding: function(e, $panel) {
    var _this = this;
    if (e.type === 'mousedown') {
      e.preventDefault();
    }

    if ($panel.is(':animated')) {
      console.log('animation processing...');
      return;       // don't start until prev-animation finish
    }

    // slide started point-x
    var _e = _this._event(event, e);
    var pointX = _e.pageX;
    $panel.pageX = $panel.xStart = $panel.flagX = pointX;

    $panel.yStart = _e.pageY;
    $panel.left = _this.leftBegin = parseInt($panel.css('left'));

    $panel.slideStarted = false;
    $panel.touched = true;
  },

  currentIndex: 1,      // slider start index
  leftStart: 0,
  leftMax: null,        //TODO: is this need??
  positionFirst: null,
  positionLast: null,

  initLayout: function() {
    this.$wrapper = $(this.target);
    this.$mainPane = this.$wrapper.find(".main-pane");
    this.$slider = this.$wrapper.find('.slider');

    // adjust box-layout order
    this.$mainPane.append(this.$slider.remove());

    // append index-attr
    this.$slider.find('ul li').each(function(idx) {
      $(this).attr('data-index', idx+1).addClass('slider-item');
    });

    // li-item copy to before-first / after-last, for loop slider
    this.setSliderItemForLoop(this.$slider.find('ul'));

    this.$sFmain_ul = this.$slider.children('ul');
    this.$sFmain_li = this.$sFmain_ul.children('li');

    //_this.listCount = $sFmain_ul.children('li').length;
    this.listCount = this.$sFmain_li.length;

    this.baseWidth = Math.round(this.$mainPane.width());

    // adjust initial size
    this.adjustSize(this.calculateInitialHeight());

    this.initArrows();
  },

  initThumbLayout: function() {
    this.$thumb.addClass('hidden');

    this.$thumb_list = this.$thumb.find('.thumb-list');
    this.$thumb_al = this.$thumb.find('.arrow.left');
    this.$thumb_ar = this.$thumb.find('.arrow.right');

    this.thumbViewWidth = 0;
    this.thumbWrapperHeight = this.thumbSize+10;

    // adjust thumbnail panel size
    this.adjustThumbWrapperSize();

    var $thumb_ul = $('<ul></ul>');
    this.$thumb_ul = $thumb_ul;
    this.$thumb_list.append($thumb_ul);
    this.$slider.find('li.slider-item img.thumb').each(function() {
      var $_li = $('<li></li>').append($(this).remove());
      $thumb_ul.append($_li);
    });

    $thumb_ul.find('li img')
      .css({'max-width': this.thumbSize, 'max-height': this.thumbSize});

    // remove first & last li-child, if loop-slider
    $thumb_ul.find('li:first-child').remove();
    $thumb_ul.find('li:last-child').remove();

    //TODO should be "sub-class member-var for thumbnail"
    this.$thumb_li = $thumb_ul.children('li');
    this.thumbCount = this.$thumb_li.length;
    this.thumbListMargin = 4;    // li { margin-right: 3px }

    //TODO should get from $thumb_li's 'horizontal-margin' or left+right ?
    this.thumbLeftMax = -400;      // set initial temporary value
  },

  setSliderItemForLoop: function($slider_ul) {
    // li-item copy to before-first / after-last, for loop slider
    var $first_child = $slider_ul.find('li:first-child').clone(true);
    $slider_ul.find('li:first-child')
      .before($slider_ul.find('li:last-child').clone(true));
    $slider_ul.find('li:last-child').after($first_child);
  },

  calculateInitialHeight: function() {
    var height = this.baseWidth;
    if (this.initialAdditionalHeight < 1) {
      height += this.baseWidth * this.initialAdditionalHeight;
    } else {
      height += this.initialAdditionalHeight;
    }
    return height;
  },

  slideTo: function(index) {
    this.currentIndex = index;
    var leftPosition = -(this.baseWidth*this.currentIndex);
    var callback = null;
    var $panel = this.$sFmain_ul;

    if (leftPosition > this.positionFirst) {
      var slidePosition = this.positionLast;
      callback = function() {
        // flick to right and slided to last-item
        $panel.css({left: slidePosition});
      };
      this.currentIndex = this.listCount-2;
    } else if (leftPosition < this.positionLast) {
      var slidePosition = this.positionFirst;
      callback = function() {
        // flick to left and slided to first-item
        $panel.css({left: slidePosition});
      };
      this.currentIndex = 1;
    }

    this.$sFmain_ul.stop()
      .animate({left: leftPosition}, this.duration, this.easing, callback);

    this.syncTbumbnail(this.currentIndex);
  },

  syncTbumbnail: function(idx) {
    try {
      this.$thumb_ul.children('li.active').removeClass('active');
      var $currentThumb = this.$thumb_ul.children('li:nth-child('+idx+')');
      $currentThumb.addClass('active');

      var ul_start = Math.abs(parseInt(this.$thumb_ul.css('left')));
      var ul_end   = ul_start + this.thumbViewWidth;
      var li_left  = $currentThumb.position().left;
      var li_right = li_left + $currentThumb.width();

      if (li_left < ul_start) {
        this.$thumb_ul.animate({left: -li_left});
      } else if (ul_end < li_right) {
        this.$thumb_ul.animate({left: -(li_right-this.thumbViewWidth+5)});
        // 5 is border-width + li-margin
      }
    } catch (ex) {
      console.dir(ex);
    }
  },

  initArrows: function() {
    var _this = this;
    var $arrowLeft = _this.$mainPane.find(".arrow.left");
    var $arrowRight = _this.$mainPane.find(".arrow.right");

    // add arrows behind slider-pane
    _this.$mainPane.append($arrowLeft.remove()).append($arrowRight.remove());

    $arrowLeft.on("click", function() {
      _this.slideTo(_this.currentIndex-1);
    });

    $arrowRight.on("click", function() {
      _this.slideTo(_this.currentIndex+1);
    });
  },

  init: function() {
    var _this = this;

    //TODO on PC browser, "anchor" tag fired on mouseup-event.
    // maybe fix? move to "onclick", cancel event at "mousemove"

    var _event = function(te, e) {
      return isTouch && te.changedTouches ? te.changedTouches[0] : e;
    };

    // slider for main-pane
    _this.$sFmain_ul.first__ = false;
    var isTouch = ('ontouchstart' in window);
    _this.$sFmain_ul.on({
      'touchstart mousedown': function(e) {
        _this.setStartIndex(e);
        _this.startSliding(e, _this.$sFmain_ul);
      },
      'touchmove mousemove': function(e) {
        //TODO make slider-hander class
        _this.handleMove(e, _this.$sFmain_ul, _this.leftMax, _this.leftStart);
      },
      'touchend mouseup mouseout': function() {
        if (!_this.$sFmain_ul.touched) {
          return;
        }
        _this.$sFmain_ul.touched = false;

        if (_this.$sFmain_ul.left < _this.leftBegin) {
          _this.slideTo(_this.startIndex+1);

        } else if (_this.leftBegin < _this.$sFmain_ul.left) {
          // flick to right (want to show prev image)
          _this.slideTo(_this.startIndex-1);
        }
      }
    });
    // end of slider for main-pane

    // make thumbnail navigator
    //var $thumb  = $wrapper.find('.thumb-pane');
    _this.$thumb  = _this.$wrapper.find('.thumb-pane');
    var $thumb_list, $thumb_al, $thumb_ar;
//    console.dir('$thumb == ' +$thumb);        //debug
    if (_this.$thumb) {
      _this.initThumbLayout();

      _this.$thumb_al.click(function() {
        _this.moveThumbTo('left');
      });
      _this.$thumb_ar.click(function() {
        _this.moveThumbTo('right');
      });

      _this.$thumb_li.click(function() {
        _this.slideTo(_this.$thumb_li.index(this)+1);
      });

      // start of thumbnail-slider
      _this.$thumb_ul.on({
        'touchstart mousedown': function(e) {
          _this.startSliding(e, _this.$thumb_ul);
        },
        'touchmove mousemove': function(e) {
          _this.handleMove(e, _this.$thumb_ul, _this.thumbLeftMax, 0);
        },
        'touchend mouseup mouseout': function() {
          if (!_this.$thumb_ul.touched) {
            return;
          }
          //TODO should fix pc-anchor tag link action
          _this.$thumb_ul.touched = false;
          // thumbnail slides only flick-distance
        }
      });
    // end of thumbnail-slider
    }

    _this.slideTo(1);     // slide to first element

    _this.initEvents();
  },

  handleMove: function(e, $panel, left, right) {
    //TODO $sFmain_ul should replace with `this`
    if (!$panel.touched) {
      return;
    }

    var _e = this._event(event, e);
    var pointX = _e.pageX;

    // check slider-position and get how manipulate after.
    if (!this.isSliderMovable($panel, pointX, _e.pageY)) {
      return;
    }

    e.preventDefault();

    if ($panel.moving) {
      return;         //TODO maybe useless
    }
    $panel.moving = true;

    //var distance = this.pageX - pointX;
    $panel.left = $panel.left - ($panel.pageX - pointX);
    $panel.pageX = pointX;

    if ($panel.left >= right) {
      $panel.left = right;
    } else if ($panel.left <= left) {
      $panel.left = left;
    }
    $panel.css({left: $panel.left});

    $panel.moving = false;
  },

  adjustThumbUlSize: function() {
    //TODO if will not change thumbnail-size, don't need this.
    var total = 0;
    this.$thumb_li.each(function() {
      total += $(this).width();
    });
    var totalWidth = total + this.thumbListMargin*(this.thumbCount+1);

    this.$thumb_ul.css({height: this.thumbWrapperHeight, width: totalWidth});
    this.$thumb_li.css({height: this.thumbSize});

    this.thumbLeftMax = -(totalWidth-this.thumbViewWidth);
  },

  adjustThumbWrapperSize: function() {
    //TODO set max-width to ul-width
    this.$thumb.css({height: this.thumbWrapperHeight, width: this.baseWidth});

    // fixed for device
    var thumbArrowWidth = Math.floor(this.baseWidth*0.1);
    //TODO should calc
    var thumbArrowCss = {height: 30, padding: '20px 0', width: thumbArrowWidth};
    this.$thumb_al.css(thumbArrowCss);
    this.$thumb_ar.css(thumbArrowCss);

    this.thumbViewWidth = Math.floor(this.baseWidth*0.8);
    this.$thumb_list.css({height: this.thumbWrapperHeight, width: this.thumbViewWidth});
  },

  moveThumbTo: function(direction) {
    // slide direction (slide to  left => add to left)
    var vector = (direction === 'left' ? 1 : -1);
    var ulLeft = parseInt(this.$thumb_ul.css('left')) || 0;
    var moveTo = ulLeft + (vector * this.thumbViewWidth/2);

    //TODO slide to first or last, if position is last or first
    if (0 <= moveTo) {
      moveTo = 0;
    } else if (moveTo <= this.thumbLeftMax) {
      moveTo = this.thumbLeftMax;
    }
    this.$thumb_ul.animate({left: moveTo}, this.duration, this.easing);
  },

  /**
   * @return boolean ... is return after "return this method"
   */
  isSliderMovable: function($panel, x, y) {
    // cancel slide event if move-y more than move-x
    if ($panel.slideStarted) {
      return true;
    }

    // calculate move x-y
    var moveX = Math.abs($panel.xStart - x);
    var moveY = Math.abs($panel.yStart - y);
    //TODO border-value should use divice-size
    if (moveX > this.flickBorder || moveY > this.flickBorder) {
      if (moveX < moveY) {
        $panel.touched = false;
        //TODO should be "pure function"
        return false;
      } else {
        // if slide started, don't need cancel horizontal slider
        $panel.slideStarted = true;
      }
    } else {
      return false;
    }
    return true;
  },

  initEvents: function() {
    var _this = this;

    _this.$sFmain_li.find('img').bind('load', function() {
      _this.adjustHeight();
    });

    $(window).bind('load', function() {
      _this.adjustHeight();
      _this.$wrapper.find('.arrow.hidden').removeClass('hidden');
    });

    $(window).bind("resize", function() {
      var _baseWidth = Math.round(_this.$mainPane.width());
      if (_baseWidth === _this.baseWidth) {
        return;
      }
      _this.baseWidth = _baseWidth;
      // adjust main slider size
      _this.adjustSize();
    });

    if (_this.$thumb) {       //TODO `if($thumb)` is valid?
      $(window).load(function() {
        _this.$thumb.removeClass('hidden');
        _this.adjustThumbUlSize();
      });

      $(window).bind("resize", function() {
        // adjust thumbnail size
        _this.adjustThumbWrapperSize();
        _this.adjustThumbUlSize();
      });
    }
  }
};



jQuery.fn.slidery = function(opts) {

  opts = opts || {};
  opts.duration = opts.duration || 300;
  opts.easing = opts.easing || 'swing';
  //var arrowWidthRatio = opts.arrowWidthRatio || '0.1';
  //var arrowHeightRatio = opts.arrowHeightRatio || '0.4';

  // temporary initial additional-height (until window.loaded)
  opts.initialAdditionalHeight = opts.initialAdditionalHeight || 0.5;

  opts.thumbSize = opts.thumbSize || 60;


  return this.each(function() {
    var slider = new Slidery(this, jQuery, opts);

    slider.initLayout();
    slider.init();
  });
};

