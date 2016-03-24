(function ($) {
	'use strict';

	var Player = function (element, opts) {
		const C_BACKWARD   = 'backward';
		const C_DIVIDER    = 'divider';
		const C_DOWNLOAD   = 'download';
		const C_FORWARD    = 'forward';
		const C_FULLSCREEN = 'fullscreen';
		const C_PLAY       = 'play';
		const C_RATE       = 'rate';
		const C_SOURCE     = 'source';
		const C_SOURCES    = 'sources';
		const C_SUBTITLE   = 'subtitle';
		const C_SUBTITLES  = 'subtitles';
		const C_TIMELINE   = 'timeline';
		const C_VOLUME     = 'volume';

		var options = $.extend(true, {
			autoplay : false,
			height   : 'auto',
			loop     : false,
			muted    : false,
			preload  : 'metadata',
			poster   : null,
			width    : 'auto',
			rate     : {
				step : 0.25,
				min  : 0.5,
				max  : 4.0
			},
			playback : {
				step : {
					short  : 5,
					medium : 30,
					long   : 60
				}
			},
			volume   : {
				step : 0.1
			},
			controls : [
				{
					element  : null,
					controls : [
						'play', 'volume', 'divider', 'timeline', 'divider', 'fullscreen'
					]
				},
				{
					element  : null,
					controls : [
						'rate', 'divider', 'backward', 'divider', 'sources', 'divider', 'subtitles', 'divider', 'download'
					]
				}
			]
		}, opts);

		class Control {
			constructor (cssClass, iconClass) {
				this.element = $('<div />').addClass('control ' + cssClass).append($('<i />').addClass('fa fa-' + iconClass));
			}

			static divider () {
				return $('<div />').addClass('divider');
			}

			static create (name) {
				switch (name) {
					case C_BACKWARD:
						return new BackwardControl();

					case C_DIVIDER:
						return this.divider();

					case C_DOWNLOAD:
						return new DownloadControl();

					case C_FORWARD:
						return new ForwardControl();

					case C_FULLSCREEN:
						return new FullscreenControl();

					case C_PLAY:
						return new PlayControl();

					case C_RATE:
						return new RateControl();

					case C_SOURCE:
					case C_SOURCES:
						return new SourceControl();

					case C_SUBTITLE:
					case C_SUBTITLES:
						return new SubtitleControl();

					case C_TIMELINE:
						return new TimelineControl();

					case C_VOLUME:
						return new VolumeControl();

					default:
						return null;
				}
			}
		}

		class ControlText {
			constructor (classname) {
				this.element = $('<div />').addClass('control-text ' + classname);
			}

			set text (value) {
				this.element.html(value);
			}
		}

		class ControlContainer {
			constructor (iconClass) {
				this.icon        = $('<div />').addClass('control-icon').append($('<i />').addClass('fa ' + iconClass));
				this.listElement = $('<div/>').addClass('control-inner');
				this.element     = $('<div />').addClass('control control-container').append(this.icon).append(this.listElement);
				this._index      = 0;
				this.list        = [];
			}

			set active (index) {
				for (let i in this.list) {
					if (this.list[ i ].data('index') == index) {
						this.list[ i ].addClass('active');
						this.icon.html(this.list[ i ].html);
					}
					else
						this.list[ i ].removeClass('active');
				}
			}

			addItem (text, index) {
				index    = index || this._index;
				var item = $('<div />').addClass('inner-item').data('index', index).html(text).click(function () {
					return this.onItemClick($(this).data('index'));
				});
				this._index++;
				this.list.push(item);
				this.listElement.append(item);

				return item;
			}

			onItemClick (index) {
				this.active = index;
			}
		}

		class BackwardControl extends Control {
			constructor () {
				super('backward', 'undo');
				this.element.click(e => {
					if (video.currentTime - options.playback.step.medium > 0)
						seek(video.currentTime - options.playback.step.medium);
					else
						seek(0);
				});
			}
		}

		class DownloadControl extends Control {
			constructor () {
				super('', '');
				this.element = $('<a />').attr('href', '').attr('target', '_blank').attr('download', '').addClass('control download').append($('<i />').addClass('fa fa-download'));
			}
		}

		class ForwardControl extends Control {
			constructor () {
				super('forward', 'redo');
			}
		}

		class FullscreenControl extends Control {
			constructor () {
				super('fullscreen', 'arrows-alt');
				this.element.click(e => {
					toggleFullscreen();
				});
			}
		}

		class PlayControl extends Control {
			constructor () {
				super('play', 'play');
				this.element.click(e => {
					togglePlay();
				});
			}
		}

		class RateControl {
			constructor () {
				this.down    = new Control('rate-down', 'fa-backward');
				this.up      = new Control('rate-up', 'fa-forward');
				this.current = new ControlText('rate-current');

				this.down.element.click(e => {
					this.decrease();
				});

				this.up.element.click(e => {
					this.increase();
				});

				this.element = $('<div />').addClass('control-container').append(this.down.element).append(this.current.element).append(this.up.element);
			}

			decrease () {
				if (video.playbackRate > options.rate.min) {
					this.up.element.removeClass('disabled');
					video.playbackRate -= options.rate.step;
					this.show();
					Cookie.set('rate', video.playbackRate);
				}
				else
					this.down.element.addClass('disabled');
			}

			show () {
				this.current.text = '×' + video.playbackRate.toFixed(2);
			}

			increase () {
				if (video.playbackRate < options.rate.max) {
					this.down.element.removeClass('disabled');
					video.playbackRate += options.rate.step;
					this.show();
					Cookie.set('rate', video.playbackRate);
				}
				else
					this.up.element.addClass('disabled');
			}
		}

		class SourceControl extends ControlContainer {
			constructor () {
				super('fa-bullseye');
				if (sources.length > 1) {
					for (var i in sources) {
						this.addItem(sources[ i ].title);
					}
				}
			}

			onItemClick (index) {
				super.onItemClick(index);
				setSource(index);
			}
		}

		class SubtitleControl extends ControlContainer {
			constructor () {
				super('fa-commenting-o');
				if (subtitles.length > 0) {
					for (var i in subtitles) {
						this.addItem(subtitles[ i ].title, subtitles[ i ].language).data('src', subtitles[ i ].src);
					}
				}
				switchTrack('');
			}

			onItemClick (index) {
				super.onItemClick(index);
				switchTrack(index);
			}
		}

		class TimelineControl {
			constructor () {
				this.current = new ControlText('time-current');
				this.total   = new ControlText('time-total');

				this.marker           = $('<div />').addClass('time-marker');
				this.markerShadow     = $('<div />').addClass('time-marker shadow').append().hide();
				this.markerShadowTime = $('<div />').addClass('time');
				this.played           = $('<div />').addClass('time-played');
				this.line             = $('<div />').addClass('timeline').click(function (e) {
					seek(video.duration * this.getPosition(e.pageX));
				}).mousemove(function (e) {
					var p = this.getPosition(e.pageX);
					if (p > 0 && p < 1) {
						this.markerShadow.show();
						this.markerShadow.css('left', p * 100 + '%');
						this.markerShadowTime.html(secondsToTime(video.duration * p));
					}
					else
						this.markerShadow.hide();
				}).mouseleave(function () {
					this.markerShadow.hide();
				});

				this.element = $('<div />').addClass('timeline-container').append($('<div />').addClass('timeline-subcontainer').append(this.current).append(this.line).append(this.total));
			}

			getPosition (x) {
				return (x - this.line.offset().left) / this.line.width();
			}

			move () {
				var t = (video.currentTime / video.duration * 100).toFixed(2) + '%';
				this.marker.css('left', t);
				this.played.css('width', t);
				this.current.text = secondsToTime(video.currentTime);
			}
		}

		class VolumeControl {
			constructor () {
				this.drag  = false;
				this.range = { bottom : 0, height : 0, top : 0 };

				this.active = $('<div/>').addClass('volume-active');
				this.marker = $('<div/>').addClass('volume-marker').on('mousedown', function (e) {
					this.drag         = true;
					this.range.height = this.line.height();
					this.range.top    = this.line.offset().top;
					this.range.bottom = this.range.top + this.range.height;
				});
				this.icon   = $('<div/>').addClass('control-icon').append($('<i />').addClass('fa fa-volume-down')).click(function () {
					this.toggleMuted();
				});
				this.line   = $('<div/>').addClass('volume-line').append(this.active).append(this.marker).click(function (e) {
					this.range.height = this.line.height();
					this.range.top    = this.line.offset().top;
					this.range.bottom = this.range.top + this.range.height;
					if (e.pageY >= range.top && e.pageY <= this.range.bottom) {
						this.value = (this.range.bottom - e.pageY) / this.range.height;
					}
				});

				this.element = $('<div />').addClass('control control-container').append(this.icon).append($('<div />').addClass('control-inner volume-slider').append(this.line));

				$(document).on('mousemove', function (e) {
					if (this.drag && e.pageY >= this.range.top && e.pageY <= this.range.bottom) {
						this.value = (range.bottom - e.pageY) / range.height;
					}
				}).on('mouseup', function (e) {
					this.drag = false;
				});
			}

			set value (value) {
				var icon = this.icon.children('.fa').eq(0);
				icon.removeClass();
				if (value < 0.05) {
					video.muted = true;
					icon.addClass('fa fa-volume-off');
				}
				else {
					video.muted  = false;
					video.volume = value;
					if (value < 0.5)
						icon.addClass('fa fa-volume-down');
					else
						icon.addClass('fa fa-volume-up');
					Cookie.set('volume', value);
				}

				var p = Math.round(value * 100).toString() + '%';
				this.active.css('height', p);
				this.marker.css('bottom', p);
			}

			toggleMuted () {
				if (video.muted == true) {
					this.value = Cookie.get('volume', 0.4);
				}
				else
					this.value = 0;
			}

		}

		class Cookie {
			static get (name, dflt) {
				var cookies = document.cookie.split(';');
				for (var i in cookies) {
					var d = cookies[ i ].trim().split('=');
					if (d[ 0 ] == 'leplayer_' + name)
						return d[ 1 ];
				}
				return dflt;
			};

			static set (name, value) {
				var d = new Date();
				d.setDate(d.year + 1);
				document.cookie = 'leplayer_' + name + '=' + value + ';expires=' + d.toString();
			};
		}

		class ControlCollection {
			constructor (active) {
				this.items  = [];
				this.active = active || false;
			}

			set volume (value) {
				if (this.has(C_VOLUME))
					this.items.volume.value = value;
			}

			add (name) {
				if (name == C_DIVIDER)
					return Control.create(name);
				else {
					this.items[ name ] = Control.create(name);
					return this.items[ name ].element;
				}
			}

			has (name) {
				return (typeof this.items[ name ] == 'object');
			}

			init () {
				this.showRate();
				this.volume = Cookie.get('volume', 0.4);
				this.initTimeline();
			}

			initTimeline () {
				if (this.has(C_TIMELINE)) {
					if (this.items.timeline.element.width() < 20)
						this.items.timeline.element.hide();
				}
			}

			showRate () {
				if (this.has(C_RATE))
					this.items.rate.show();
			}
		}

		class Controls {
			constructor () {
				this.collections               = {
					common     : new ControlCollection(),
					mini       : new ControlCollection(),
					fullscreen : new ControlCollection()
				};
				this.collections.common.active = true;
			}

			init () {
				for (var i in this.collections)
					this.collections[ i ].init();
			}
		}

		var sources   = [];
		var subtitles = [];
		var volume    = 0.5;
		var video     = null;
		var controls  = {
			collections : {
				common     : new ControlCollection(),
				mini       : new ControlCollection(),
				fullscreen : new ControlCollection()
			},
			init        : function () {
				for (var i in this.collections)
					this.collections[ i ].init();
			},
			showRate    : function () {
				for (var i in this.collections)
					if (this.collections[ i ].active)
						this.collections[ i ].init();
			}
		};

		/**
		 * DOM container to hold video and all other stuff.
		 * @type object
		 */
		var container = null;
		var overlay   = null;

		var init = function () {
			// Check if element is correctly selected.
			if (element.prop('tagName').toLowerCase() != 'video') {
				console.warn('Incorrect element selected.');
				return this;
			}

			// Set source.
			element.children('source').each(function () {
				var src = $(this).attr('src');
				if (src)
					sources.push({
						src   : src,
						title : $(this).attr('title')
					});
			});
			if (sources.length == 0) {
				var src = element.attr('src');
				if (src) {
					sources.push({
						src   : src,
						title : $(this).attr('title') || 'default'
					});
				}
			}
			if (sources.length == 0) {
				console.warn('No sources found.');
				return this;
			}

			initOptions();
			initDom();
			initSubtitles();
			initControls();
			initHotKeys();

			setSource(0);
		};

		var initControls = function () {
			for (var i in options.controls) {
				var el          = options.controls[ i ].element;
				var hasTimeline = false;
				if (el == null)
					el = $('<div />').addClass('leplayer-controls');
				if (el.length == 0) {
					console.warn('Error creating controls.');
				}
				else {
					for (var k in options.controls[ i ].controls) {
						var controlName = options.controls[ i ].controls[ k ];

						if (controlName == C_DIVIDER || !controls.common.has(controlName)) {
							// Create control only if divider or does not exist yet.
							var c = controls.common.add(controlName);
							if (c != null) {
								el.append(c);
								if (controlName == C_TIMELINE)
									hasTimeline = true;
							}
							else
								console.warn('Cannot create ' + controlName + ' control.');
						}
					}
					if (!hasTimeline)
						el.css('width', '1px');
					el.find('.divider+.divider').remove();
					container.append(el);
				}
			}
			video.playbackRate = Cookie.get('rate', 1);
			controls.common.init();
		};

		var initDom = function () {

			overlay            = $('<div />').addClass('play-overlay');
			var videoContainer = $('<div />').addClass('leplayer-video').append(overlay);
			container          = $('<div />').addClass('leplayer-container').append(videoContainer).css('width', element.width() + 'px');

			element.before(container);
			videoContainer.append(element);
			video = element[ 0 ];
			video.addEventListener('loadedmetadata', function (e) {
				overlay.css('line-height', e.target.clientHeight + 'px').html('<i class="fa fa-play"></i>');
				container.css('width', e.target.clientWidth + 'px');
				if (typeof controls.time != 'undefined')
					controls.time.total.html(secondsToTime(video.duration));
			});
			video.ontimeupdate = function () {
				controls.time.move();
			};
			overlay.click(function () {
				togglePlay();
			});
		};

		var initHotKeys = function () {
			// Space.
			element.keypress(function (e) {
				if (e.charCode == 32)
					togglePlay();
			}).click(function () {
				togglePlay();
			});
		};

		var initOptions = function () {

			// Controls.
			element.removeAttr('controls');

			// Height.
			var h = element.attr('height');
			if (h) {
				options.height = h + 'px';
				element.removeAttr('height');
			}
			element.css('height', options.height);

			// Width.
			var w = element.attr('width');
			if (w) {
				options.width = w + 'px';
				element.removeAttr('width');
			}
			element.css('width', options.width);

			// Poster.
			var p = element.attr('poster');
			if (p)
				options.poster = p;
			else if (options.poster)
				element.attr('poster', options.poster);

			// Autoplay, loop, muted.
			var attrs = [ 'autoplay', 'loop', 'muted' ];
			for (var i in attrs) {
				var a = element.attr(attrs[ i ]);
				if (a)
					options[ attrs[ i ] ] = true;
				else if (options[ attrs[ i ] ])
					element.attr(attrs[ i ], '');
				else
					element.removeAttr(attrs[ i ]);
				element.prop(attrs[ i ], options[ attrs[ i ] ]);
			}

			// Preload.
			var r = element.attr('preload');
			if (r) {
				r = r.toLowerCase();
				if (r == 'none' || r == 'metadata')
					options.preload = r;
				else
					options.preload = 'auto';
			}
			element.attr('preload', options.preload);
		};

		var initSubtitles = function () {

			element.children('track[kind="subtitles"]').each(function () {
				var language = $(this).attr('srclang');
				var title    = $(this).attr('label');
				var src      = $(this).attr('src');
				if (title.length > 0 && src.length > 0) {
					subtitles.push({
						title    : title,
						src      : src,
						language : language
					});
				}
			});

			// This is generally for Firefox only
			// because it somehow resets track list
			// for video element after DOM manipulation.

			if (video.textTracks.length == 0 && subtitles.length > 0) {
				element.children('track[kind="subtitles"]').remove();
				for (var i in subtitles) {
					element.append($('<track/>').attr('label', subtitles[ i ].title).attr('src', subtitles[ i ].src).attr('srclang', subtitles[ i ].language).attr('id', subtitles[ i ].language).attr('kind', 'subtitles'));
				}
			}
		};

		var togglePlay = function () {
			if (!video.played || video.paused) {
				overlay.hide();
				video.play();
				if (typeof controls.play != 'undefined')
					controls.play.children('.fa').removeClass('fa-play').addClass('fa-pause');
			}
			else {
				overlay.show();
				video.pause();
				if (typeof controls.play != 'undefined')
					controls.play.children('.fa').removeClass('fa-pause').addClass('fa-play');
			}
		};

		var toggleFullscreen = function () {
			if (video.requestFullScreen)
				video.requestFullScreen();
			else if (video.webkitRequestFullScreen)
				video.webkitRequestFullScreen();
			else if (video.mozRequestFullScreen)
				video.mozRequestFullScreen();
			else
				console.warn('Cannot toggle fullscreen.');
		};

		var secondsToTime = function (seconds) {
			var h   = Math.floor(seconds / 3600);
			var m   = Math.floor(seconds % 3600 / 60);
			var s   = Math.floor(seconds % 3600 % 60);
			var out = '';
			if (h > 0)
				out = h + ':';
			if (m < 10)
				out += '0';
			out += m + ':';
			if (s < 10)
				out += '0';
			out += s;
			return out;
		};

		var seek = function (time) {
			video.currentTime = time;
		};

		var setSource = function (index) {
			if (typeof sources[ index ] != 'undefined') {
				element.attr('src', sources[ index ].src);

				if (typeof controls.sources != 'undefined') {
					controls.sources.setActive(index);
				}

				if (typeof controls.download != 'undefined') {
					controls.download.attr('href', sources[ index ].src).attr('download', sources[ index ].src);
				}
			}
		};

		var switchTrack = function (language) {
			if (video.textTracks.length > 0) {
				for (var i = 0; i < video.textTracks.length; i++) {
					if (video.textTracks[ i ].language == language)
						video.textTracks[ i ].mode = 'showing';
					else
						video.textTracks[ i ].mode = 'hidden';
				}
			}
		};

		init();
		return this;
	};

	$.fn.lePlayer = function (options) {
		return this.each(function () {
			Player($(this), options);
		});
	};
}(jQuery));