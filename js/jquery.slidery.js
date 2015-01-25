//document.write('<div><h2>version 0.5.3</h2></div>');

/**
 * slider for SmartDevices
 * Specs
 *    - always loop slide
 *    - not slide-show
 */

jQuery.fn.slidery = function(opts) {

  opts = opts || {};
  opts.duration = opts.duration || 300;
  opts.easing = opts.easing || 'swing';
  //var arrowWidthRatio = opts.arrowWidthRatio || '0.1';
  //var arrowHeightRatio = opts.arrowHeightRatio || '0.4';

  // temporary initial additional-height (until window.loaded)
  opts.initialAdditionalHeight = opts.initialAdditionalHeight || 0.5;

  opts.thumbSize = opts.thumbSize || 60;


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
    init: function() {
      var _this = this;
      var currentIndex = 1;      // slider start index

      var $wrapper = $(_this.target);
      var $mainPane = $wrapper.find(".main-pane");
      var $arrowLeft = $mainPane.find(".arrow.left");
      var $arrowRight = $mainPane.find(".arrow.right");
      var $slider = $wrapper.find('.slider');

      // adjust box-layout order
      $mainPane.append($slider.remove())
        .append($arrowLeft.remove()).append($arrowRight.remove());

      // append index-attr
      $slider.find('ul li').each(function(idx) {
        $(this).attr('data-index', idx+1).addClass('slider-item');
      });

      // li-item copy to before-first / after-last, for loop slider
      var $slider_first_child = $slider.find('ul li:first-child').clone(true);
      $slider.find('ul li:first-child')
        .before($slider.find('ul li:last-child').clone(true));
      $slider.find('ul li:last-child').after($slider_first_child);

      var $sFmain_ul = $slider.children('ul');
      var $sFmain_li = $sFmain_ul.children('li');

      var adjustSize = function(_height) {
        //TODO arrow-width should calc
        //var arrowWidth = Math.round(baseWidth * arrowWidthRatio);
        //$arrowLeft.css({width: arWidth}),
        //$arrowRight.css({width: arWidth});

        //TODO adjustWidth ??
        listWidth = baseWidth;      // full-width
        leftMax = -listWidth * (listCount - 1);
        positionFirst = -listWidth;
        positionLast = -listWidth * (listCount - 2);

        $slider.css({width: listWidth, height: _height});
        $sFmain_li.css({width: listWidth});

        // slide to current item
        $sFmain_ul.css({left: -listWidth*currentIndex});

        if (void 0 === _height) {
          adjustHeight();     // adjust height with each li-height
        }
      };

      var adjustHeight = function() {
        var highest = 0;
        $sFmain_li.each(function() {
          var height = 0;
          $(this).children().each(function() {
            height += $(this).height();
          });
          if (highest < height) { highest = height; }
        });

        $sFmain_li.css({height: highest});
        $slider.css({height: highest, margin: 0});
        //$thumb.removeClass('hidden');
      };

      var listCount = $sFmain_ul.children('li').length;
      var leftStart = 0;

      var baseWidth = Math.round($mainPane.width());
      var listWidth, leftMax, positionFirst, positionLast;

      // adjust initial size
      var initialHeight = baseWidth +
        (_this.initialAdditionalHeight < 1 ?
          baseWidth*_this.initialAdditionalHeight :
          _this.initialAdditionalHeight);
      adjustSize(initialHeight);

      $(window).bind('load', function() {
        adjustHeight();
        $wrapper.find('.arrow.hidden').removeClass('hidden');
      });

      $sFmain_li.find('img').bind('load', function() {
        adjustHeight();
      });

      $(window).bind("resize", function() {
        var _baseWidth = Math.round($mainPane.width());
        if (_baseWidth === baseWidth) {
          return;
        }
        baseWidth = _baseWidth;
        // adjust main slider size
        adjustSize();

        // adjust thumbnail size
        adjustThumbWrapperSize();
        adjustThumbUlSize();
      });


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
      $sFmain_ul.bind({
        'touchstart mousedown': function(e) {
          // flick started list-item
          var index = $(e.target).attr('data-index');
          if (void 0 === index) {
            index = $(e.target).parents('.slider-item').attr('data-index');
          }
          this.startIndex = parseInt(index);

          if (e.type === 'mousedown') {
            e.preventDefault();
          }

          var $setMainUlNot = $slider.children('ul:not(:animated)');
          $setMainUlNot.each(function() {
            // slide started point-x
            var _e = _event(event, e);
            var pointX = _e.pageX;
            this.pageX = this.xStart = this.flagX = pointX;

            this.yStart = _e.pageY;
            this.left = this.leftBegin = parseInt($(this).css('left'));

            this.slideStarted = false;
            this.touched = true;
          });
        },
        'touchmove mousemove': function(e) {
          if (!this.touched) {
            return;
          }

          var _e = _event(event, e);
          var pointX = _e.pageX;

          // cancel slide event if move-y more than move-x
          if (!this.slideStarted) {
            // calculate move x-y
            var moveX = Math.abs(this.xStart - pointX);
            var moveY = Math.abs(this.yStart - _e.pageY);
            if (moveX > flickBorder || moveY > flickBorder) {
              if (moveX < moveY) {
                this.touched = false;
                return;
              } else {
                // if slide started, don't need cancel horizontal slider
                this.slideStarted = true;
              }
            } else {
              // don't move until move over 'border' for x or y.
              return;
            }
          }
          e.preventDefault();

          if (this.moving) {
            return;
          }
          this.moving = true;

          //var distance = this.pageX - pointX;
          this.left = this.left - (this.pageX - pointX);
          this.pageX = pointX;

          if (this.left >= leftStart) {
            this.left = leftStart;
          } else if (this.left <= leftMax) {
            this.left = leftMax;
          }
          $(this).css({left: this.left});

          //var prop = {'-webkit-transform': 'translate3d(-'+distance+'px,0,0)'};
          //console.log(prop);
          //$(this).css(prop);

          this.moving = false;
        },
        'touchend mouseup mouseout': function() {
          if (!this.touched) {
            return;
          }
          this.touched = false;

          if (this.left < this.leftBegin) {
            // flick to left (want to show next image)
    //          slideTo(this.startIndex+1);
            slideTo(this.startIndex+1, this.left);

          } else if (this.leftBegin < this.left) {
            // flick to right (want to show prev image)
    //          slideTo(this.startIndex-1);
            slideTo(this.startIndex-1, this.left);
          }
        }
      });
      // end of slider for main-pane

      var slideTo = function(index) {
        currentIndex = index;
        var leftPosition = -(baseWidth*currentIndex);
        var callback = null;

        if (leftPosition > positionFirst) {
          callback = function() {
            // flick to right and slided to last-item
            $sFmain_ul.css({left: positionLast});
          };
          currentIndex = listCount-2;
        } else if (leftPosition < positionLast) {
          callback = function() {
            // flick to left and slided to first-item
            $sFmain_ul.css({left: positionFirst});
          };
          currentIndex = 1;
        }

        $sFmain_ul.stop()
          .animate({left: leftPosition}, _this.duration, _this.easing, callback);

        syncTbumbnail(currentIndex);
      };

      $arrowLeft.on("click", function() {
        slideTo(currentIndex-1);
      });

      $arrowRight.on("click", function() {
        slideTo(currentIndex+1);
      });


      var $currentThumb;
      var syncTbumbnail = function(idx) {
        try {
          $thumb_ul.children('li.active').removeClass('active');
          $currentThumb = $thumb_ul.children('li:nth-child('+idx+')');
          $currentThumb.addClass('active');

          var ul_start = Math.abs(parseInt($thumb_ul.css('left')));
          var ul_end   = ul_start + thumbViewWidth;
          var li_left  = $currentThumb.position().left;
          var li_right = li_left + $currentThumb.width();

          if (li_left < ul_start) {
            $thumb_ul.animate({left: -li_left});
          } else if (ul_end < li_right) {
            $thumb_ul.animate({left: -(li_right-thumbViewWidth+5)});
            // 5 is border-width + li-margin
          }
        } catch (ex) {
          console.dir(ex);
        }
      };

      // make thumbnail navigator
      //var $thumb  = $wrapper.find('.thumb-pane');
      _this.$thumb  = $wrapper.find('.thumb-pane');
      var $thumb_list, $thumb_al, $thumb_ar;
  //    console.dir('$thumb == ' +$thumb);        //debug
      if (_this.$thumb) {
        _this.$thumb.addClass('hidden');

        $thumb_list = _this.$thumb.find('.thumb-list');
        $thumb_al = _this.$thumb.find('.arrow.left');
        $thumb_ar = _this.$thumb.find('.arrow.right');

        var thumbViewWidth;
        var thumbWrapperHeight = _this.thumbSize+10;

        var adjustThumbWrapperSize = function() {
          //TODO set max-width to ul-width
          _this.$thumb.css({height: thumbWrapperHeight, width: baseWidth});

          // fixed for device
          var thumbArrowWidth = Math.floor(baseWidth*0.1);
          //TODO should calc
          var thumbArrowCss = {height: 30, padding: '20px 0', width: thumbArrowWidth};
          $thumb_al.css(thumbArrowCss);
          $thumb_ar.css(thumbArrowCss);

          thumbViewWidth = Math.floor(baseWidth*0.8);
          $thumb_list.css({height: thumbWrapperHeight, width: thumbViewWidth});
        };
        adjustThumbWrapperSize();

        var $thumb_ul = $('<ul></ul>');
        $thumb_list.append($thumb_ul);
        $slider.find('li.slider-item img.thumb').each(function() {
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
          var moveTo = ulLeft + (vector * thumbViewWidth/2);

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

          thumbLeftMax = -(totalWidth-thumbViewWidth);
        };

        $(window).load(function() {
          _this.$thumb.removeClass('hidden');
          adjustThumbUlSize();
        });

        $thumb_li.click(function() {
          slideTo($thumb_li.index(this)+1);
        });

        // start of thumbnail-slider
        $thumb_ul.bind({
          'touchstart mousedown': function(e) {
            if (e.type === 'mousedown') {
              e.preventDefault();
            }

            //TODO should find by "parent ul-node" from .....
            var $thumbUlNot = _this.$thumb.find('ul:not(:animated)');
            $thumbUlNot.each(function() {
              var _e = _event(event, e);
              var pointX = _e.pageX;    // slide started point-x
              this.pageX = this.xStart = this.flagX = pointX;
              this.yStart = _e.pageY;

              this.left = this.leftBegin = parseInt($(this).css('left'));

              this.slideStarted = false;
              this.touched = true;
            });
          },
          'touchmove mousemove': function(e) {
            if (!this.touched) {
              return;
            }

            var _e = _event(event, e);
            var pointX = _e.pageX;

            // cancel slide event if move-y more than move-x
            if (!this.slideStarted) {
              // calculate move x-y
              var moveX = Math.abs(this.xStart - pointX);
              var moveY = Math.abs(this.yStart - _e.pageY);
              var border = 10;     // flick distance border
              //TODO border-value should use divice-size
              if (moveX > border || moveY > border) {
                if (moveX < moveY) {
                  this.touched = false;
                  return;
                } else {
                  // if slide started, don't need cancel horizontal slider
                  this.slideStarted = true;
                }
              } else {
                return;
              }
            }
            e.preventDefault();

            this.left = (this.left || 0) - (this.pageX - pointX);
            this.pageX = pointX;

            if (this.left < 0 && this.left > thumbLeftMax) {
              $(this).css({left: this.left});
            } else if (this.left >= 0) {
              $(this).css({left: 0});
            } else if (this.left <= thumbLeftMax) {
              $(this).css({left: thumbLeftMax});
            }
          },
          'touchend mouseup mouseout': function() {
            if (!this.touched) {
              return;
            }
            //TODO should fix pc-anchor tag link action
            this.touched = false;
            // thumbnail slides only flick-distance
          }
        });
      // end of thumbnail-slider
      }

      slideTo(1);     // slide to first element
    },
    hoge: function() {
    }
  };


  return this.each(function() {
    var slider = new Slidery(this, jQuery, opts);

    slider.init();

  });
};

