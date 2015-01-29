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

  initLayout: function() {
    var _this = this;
    _this.currentIndex = 1;      // slider start index

    _this.$wrapper = $(_this.target);
    var $mainPane = _this.$wrapper.find(".main-pane");
    _this.$mainPane = $mainPane;
    _this.$slider = _this.$wrapper.find('.slider');

    // adjust box-layout order
    $mainPane.append(_this.$slider.remove());

    // append index-attr
    _this.$slider.find('ul li').each(function(idx) {
      $(this).attr('data-index', idx+1).addClass('slider-item');
    });

    // li-item copy to before-first / after-last, for loop slider
    var $slider_first_child = _this.$slider.find('ul li:first-child').clone(true);
    _this.$slider.find('ul li:first-child')
      .before(_this.$slider.find('ul li:last-child').clone(true));
    _this.$slider.find('ul li:last-child').after($slider_first_child);

    _this.$sFmain_ul = _this.$slider.children('ul');
    var $sFmain_li = _this.$sFmain_ul.children('li');
    _this.$sFmain_li = $sFmain_li;

    //_this.listCount = $sFmain_ul.children('li').length;
    _this.listCount = _this.$sFmain_li.length;
    _this.leftStart = 0;

    _this.baseWidth = Math.round($mainPane.width());
    _this.leftMax = null;
    _this.positionFirst = null;
    _this.positionLast = null;

    // adjust initial size
    var initialHeight = _this.baseWidth +
      (_this.initialAdditionalHeight < 1 ?
        _this.baseWidth*_this.initialAdditionalHeight :
        _this.initialAdditionalHeight);
    _this.adjustSize(initialHeight);

    $sFmain_li.find('img').bind('load', function() {
      _this.adjustHeight();
    });

    _this.initArrows();
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
//console.log('thumb selector -> li:nth-child('+idx+')');
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

    var flickBorder = 15;     // flick distance border
    //TODO change "shikii-chi" with display size
    // never mind "devicePixelRatio"

    // slider for main-pane
    var isTouch = ('ontouchstart' in window);
    _this.$sFmain_ul.on({
      'touchstart mousedown': function(e) {
        _this.setStartIndex(e);
        _this.startSliding(e, _this.$sFmain_ul);
      },
      'touchmove mousemove': function(e) {
        if (!_this.$sFmain_ul.touched) {
          return;
        }

        var _e = _event(event, e);
        var pointX = _e.pageX;

        // cancel slide event if move-y more than move-x
        if (!_this.$sFmain_ul.slideStarted) {
          // calculate move x-y
          var moveX = Math.abs(_this.$sFmain_ul.xStart - pointX);
          var moveY = Math.abs(_this.$sFmain_ul.yStart - _e.pageY);
          if (moveX > flickBorder || moveY > flickBorder) {
            if (moveX < moveY) {
              _this.$sFmain_ul.touched = false;
              return;
            } else {
              // if slide started, don't need cancel horizontal slider
              _this.$sFmain_ul.slideStarted = true;
            }
          } else {
            // don't move until move over 'border' for x or y.
            return;
          }
        }
        e.preventDefault();

        if (_this.$sFmain_ul.moving) {
          return;
        }
        _this.$sFmain_ul.moving = true;

        //var distance = this.pageX - pointX;
        _this.$sFmain_ul.left = _this.$sFmain_ul.left
              - (_this.$sFmain_ul.pageX - pointX);
        _this.$sFmain_ul.pageX = pointX;

        if (_this.$sFmain_ul.left >= _this.leftStart) {
          _this.$sFmain_ul.left = _this.leftStart;
        } else if (_this.$sFmain_ul.left <= _this.$sFmain_ul.leftMax) {
          _this.$sFmain_ul.left = _this.$sFmain_ul.leftMax;
        }
        _this.$sFmain_ul.css({left: _this.$sFmain_ul.left});

        //var prop = {'-webkit-transform': 'translate3d(-'+distance+'px,0,0)'};
        //console.log(prop);
        //$(this).css(prop);

        _this.$sFmain_ul.moving = false;
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
      _this.$thumb.addClass('hidden');

      $thumb_list = _this.$thumb.find('.thumb-list');
      $thumb_al = _this.$thumb.find('.arrow.left');
      $thumb_ar = _this.$thumb.find('.arrow.right');

      _this.thumbViewWidth = 0;
      var thumbWrapperHeight = _this.thumbSize+10;

      var adjustThumbWrapperSize = function() {
        //TODO set max-width to ul-width
        _this.$thumb.css({height: thumbWrapperHeight, width: _this.baseWidth});

        // fixed for device
        var thumbArrowWidth = Math.floor(_this.baseWidth*0.1);
        //TODO should calc
        var thumbArrowCss = {height: 30, padding: '20px 0', width: thumbArrowWidth};
        $thumb_al.css(thumbArrowCss);
        $thumb_ar.css(thumbArrowCss);

        _this.thumbViewWidth = Math.floor(_this.baseWidth*0.8);
        $thumb_list.css({height: thumbWrapperHeight, width: _this.thumbViewWidth});
      };
      adjustThumbWrapperSize();

      $(window).bind("resize", function() {
        // adjust thumbnail size
        adjustThumbWrapperSize();
        adjustThumbUlSize();
      });

      var $thumb_ul = $('<ul></ul>');
      _this.$thumb_ul = $thumb_ul;
      $thumb_list.append($thumb_ul);
      _this.$slider.find('li.slider-item img.thumb').each(function() {
        var $_li = $('<li></li>').append($(this).remove());
        $thumb_ul.append($_li);
      });

      $thumb_ul.find('li img')
        .css({'max-width': _this.thumbSize, 'max-height': _this.thumbSize});

      // remove first & last li-child, if loop-slider
      $thumb_ul.find('li:first-child').remove();
      $thumb_ul.find('li:last-child').remove();

      var moveThumbTo = function(direction) {
        // slide direction (slide to  left => add to left)
        var vector = (direction === 'left' ? 1 : -1);
        var ulLeft = parseInt($thumb_ul.css('left')) || 0;
        var moveTo = ulLeft + (vector * _this.thumbViewWidth/2);

        //TODO slide to first or last, if position is last or first
        if (0 <= moveTo) {
          moveTo = 0;
        } else if (moveTo <= thumbLeftMax) {
          moveTo = thumbLeftMax;
        }
        $thumb_ul.animate({left: moveTo}, _this.duration, this.easing);
      };

      $($thumb_al).click(function() {
        moveThumbTo('left');
      });
      $($thumb_ar).click(function() {
        moveThumbTo('right');
      });

      var $thumb_li = $thumb_ul.children('li');
      var thumbCount = $thumb_li.length;
      var thumbListMargin = 4;    // li { margin-right: 3px }
      //TODO should get from $thumb_li's 'horizontal-margin' or left+right ?
      var thumbLeftMax = -400;      // set initial temporary value

      var adjustThumbUlSize = function() {
        //TODO if will not change thumbnail-size, don't need this.
        var total = 0;
        $thumb_li.each(function() {
          total += $(this).width();
        });
        var totalWidth = total + thumbListMargin*(thumbCount+1);

        $thumb_ul.css({height: thumbWrapperHeight, width: totalWidth});
        $thumb_li.css({height: _this.thumbSize});

        thumbLeftMax = -(totalWidth-_this.thumbViewWidth);
      };

      $(window).load(function() {
        _this.$thumb.removeClass('hidden');
        adjustThumbUlSize();
      });

      $thumb_li.click(function() {
        _this.slideTo($thumb_li.index(this)+1);
      });

      // start of thumbnail-slider
      $thumb_ul.on({
        'touchstart mousedown': function(e) {
console.log('thumb - touchstart');
          _this.startSliding(e, $thumb_ul);
        },
        'touchmove mousemove': function(e) {
          if (!$thumb_ul.touched) {
            return;
          }

          var _e = _event(event, e);
          var pointX = _e.pageX;

          // cancel slide event if move-y more than move-x
          if (!$thumb_ul.slideStarted) {
            // calculate move x-y
            var moveX = Math.abs($thumb_ul.xStart - pointX);
            var moveY = Math.abs($thumb_ul.yStart - _e.pageY);
            var border = 10;     // flick distance border
            //TODO border-value should use divice-size
            if (moveX > border || moveY > border) {
              if (moveX < moveY) {
                $thumb_ul.touched = false;
                return;
              } else {
                // if slide started, don't need cancel horizontal slider
                $thumb_ul.slideStarted = true;
              }
            } else {
              return;
            }
          }
          e.preventDefault();

          $thumb_ul.left = ($thumb_ul.left || 0) - ($thumb_ul.pageX - pointX);
          $thumb_ul.pageX = pointX;

          if ($thumb_ul.left < 0 && $thumb_ul.left > thumbLeftMax) {
            $thumb_ul.css({left: $thumb_ul.left});
          } else if ($thumb_ul.left >= 0) {
            $thumb_ul.css({left: 0});
          } else if ($thumb_ul.left <= thumbLeftMax) {
            $thumb_ul.css({left: thumbLeftMax});
          }
        },
        'touchend mouseup mouseout': function() {
//console.log('thumb - touchend');
          if (!$thumb_ul.touched) {
            return;
          }
          //TODO should fix pc-anchor tag link action
          $thumb_ul.touched = false;
          // thumbnail slides only flick-distance
        }
      });
    // end of thumbnail-slider
    }

    _this.slideTo(1);     // slide to first element

    _this.initEvents();
  },

  initEvents: function() {
    var _this = this;

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

