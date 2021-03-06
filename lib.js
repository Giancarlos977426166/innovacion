(function() {
    "use strict";
    window.Util = {
        randint: function(n) {
            return ~~(Math.random() * n)
        }
    };
    if (!("bind" in Function)) {
        Function.prototype.bind = function(context) {
            var self = this;
            return function() {
                return self.apply(context, arguments)
            }
        }
    }
    var $ = Class.extend({
        init: function(id) {
            this.elem = document.getElementById(id)
        }
    });
    var addEvent = function(elem, event, callback) {
        if (document.addEventListener) {
            return function(elem, type, callback) {
                elem.addEventListener(type, callback, false)
            }
        } else {
            return function(elem, type, callback) {
                elem.attachEvent("on" + type, function(e) {
                    e = e || event;
                    e.preventDefault = e.preventDefault || function() {
                        this.returnValue = false
                    };
                    e.stopPropagation = e.stopPropagation || function() {
                        this.cancelBubble = true
                    };
                    return callback.call(e.target || e.srcElement, e)
                })
            }
        }
    }();
    var events = ("mousemove mouseover mouseout mousedown mouseup click touchstart dblclick focus blur submit change").split(" ");
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        $.prototype[event] = function(event) {
            return function(selector, fn) {
                if (typeof selector == "function") {
                    addEvent(this.elem, event, selector)
                } else {
                    addEvent(this.elem, event, function(e) {
                        var elem = e.target || e.srcElement;
                        if (elem.tagName.toLowerCase() == selector) {
                            e.stopPropagation();
                            fn.call(elem, e)
                        }
                    }, false)
                }
            }
        }(event)
    }
    Util.fullScreen = function() {
        if (document.documentElement.scrollHeight < window.outerHeight / window.devicePixelRatio) {
            document.body.style.height = window.outerHeight / window.devicePixelRatio + 1 + "px";
            setTimeout(function() {
                window.scrollTo(1, 1)
            }, 0)
        } else {
            window.scrollTo(1, 1)
        }
    };
    Util.getContext = function(canvas) {
        if (!canvas.getContext && window.G_vmlCanvasManager) {
            G_vmlCanvasManager.initElement(canvas)
        }
        return canvas.getContext("2d")
    };
    Util.extend = function(orig, obj) {
        var attr;
        for (attr in obj) {
            if (obj.hasOwnProperty(attr) && !(attr in orig)) {
                orig[attr] = obj[attr]
            }
        }
        return orig
    };
    Util.calcPieces = function(img, tmpl) {
        var w = img.width,
            h = img.height,
            options = [],
            select = document.getElementById("set-parts"),
            option, size, cols, rows, parts;
        //select.innerHTML = "";
        for (var i = 10; i <= 100; i += 10) {
            var size = ~~Math.sqrt(w * h / i),
                cols = ~~(w / size),
                rows = ~~(h / size);
            while (cols * rows < i) {
                size--;
                cols = ~~(w / size);
                rows = ~~(h / size)
            }
            if (parts != cols * rows) {
                parts = cols * rows;
                option = document.createElement("option");
                option.value = i;
                option.innerHTML = tmpl.replace("%d", parts);
                //select.appendChild(option)
            }
        }
    };
    Util.addEvent = addEvent;
    Util.$ = function() {
        var _ = $();
        return function(id) {
            _.elem = document.getElementById(id);
            return _
        }
    }()
})();
(function() {
    "use strict";
    var ctx = Util.getContext(document.createElement("canvas")),
        abs = Math.abs;

    function check_position(f1, f2) {
        console.log(f1);
        console.log(f2);
        if (f1.rotation % 360 || f2.rotation % 360 || f2.hide || f1.hide || f1.row != f2.row && f1.col != f2.col) {
            return
        }        
        var diff_x = f1.tx - f2.tx,
            diff_y = f1.ty - f2.ty,
            diff_col = f1.col - f2.col,
            diff_row = f1.row - f2.row,
            s = f1.size;
        var sep = s/6;
        if ((diff_col == -1 && diff_x < 0 && abs(diff_x + s) < sep || diff_col == 1 && diff_x >= 0 && abs(diff_x - s) < sep) && diff_y <= sep && diff_y >= -sep) {
            return [f1.col > f2.col ? -abs(diff_x) + s : abs(diff_x) - s, f2.ty - f1.ty]
        } else if ((diff_row == -1 && diff_y < 0 && abs(diff_y + s) < sep || diff_row == 1 && diff_y >= 0 && abs(diff_y - s) < sep) && diff_x <= sep && diff_x >= -sep) {
            return [f2.tx - f1.tx, f1.row > f2.row ? -abs(diff_y) + s : abs(diff_y) - s]
        }
    }
    var Piece = Cevent.Shape.extend({
            type: "piece",
            init: function(x, y, img, size, edges) {
                this._super(x, y);
                var half_s = size / 2;
                this.img = img;
                this.size = size;
                this.edges = edges;
                this.tx = this.x + half_s;
                this.ty = this.y + half_s;
                this.x = -half_s;
                this.y = -half_s
            },
            draw_path: function(ctx) {                
                var s = this.size,
                    fn, i = 0;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                for (; i < 4; i++) {
                    fn = this.edges[i];
                    if (fn) {
                        var cx = this[fn](ctx, s, this.x, this.y)
                    } else {
                        ctx.lineTo(this.x + s, this.y)
                    }
                    ctx.rotate(Math.PI / 2)
                }
                ctx.closePath()
            },
            render: function(ox, oy) {
                var ctx = Util.getContext(document.createElement("canvas")),
                    s = this.size + .5;
                ctx.canvas.width = s * 2;
                ctx.canvas.height = s * 2;
                ctx.save();
                this.applyStyle(ctx);
                ctx.lineWidth = .5;
                ctx.translate(s, s);
                this.draw_path(ctx);
                ctx.clip();
                ctx.drawImage(this.img, -this.tx - ox, -this.ty - oy);
                if (this.stroke) {
                    ctx.strokeStyle = "#000";
                    ctx.stroke()
                }
                ctx.restore();
                this.tx += this.offset;
                this.img = ctx.canvas
            },
            outside: function(ctx, s, cx, cy) {
                ctx.lineTo(cx + s * .34, cy);                
                ctx.bezierCurveTo(cx + s * .504, cy, cx + s * .4, cy + s * -.15, cx + s * .4, cy + s * -.15);
                ctx.bezierCurveTo(cx + s * .3, cy + s * -.3, cx + s * .5, cy + s * -.3, cx + s * .5, cy + s * -.3);
                ctx.bezierCurveTo(cx + s * .7, cy + s * -.3, cx + s * .6, cy + s * -.15, cx + s * .6, cy + s * -.15);
                ctx.bezierCurveTo(cx + s * .5, cy, cx + s * .65, cy, cx + s * .65, cy);
                ctx.lineTo(cx + s, cy)
            },
            inside: function(ctx, s, cx, cy) {
                ctx.lineTo(cx + s * .35, cy);
                ctx.bezierCurveTo(cx + s * .505, cy + .05, cx + s * .405, cy + s * .155, cx + s * .405, cy + s * .1505);
                ctx.bezierCurveTo(cx + s * .3, cy + s * .3, cx + s * .5, cy + s * .3, cx + s * .5, cy + s * .3);
                ctx.bezierCurveTo(cx + s * .7, cy + s * .29, cx + s * .6, cy + s * .15, cx + s * .6, cy + s * .15);
                ctx.bezierCurveTo(cx + s * .5, cy, cx + s * .65, cy, cx + s * .65, cy);
                ctx.lineTo(cx + s, cy)
            },
            draw: function(ctx) {
                if (this.hide) {
                    return
                }
                var half_size = this.size / 2 - .5;
                this.setTransform(ctx);
                ctx.drawImage(this.img, this.x - half_size, this.y - half_size)
            },
            check: function(other) {
                var r;
                if (other.type == "piece") {
                    r = check_position(this, other)
                } else {
                   
                    var i, l = other.pieces.length;
                    for (i = 0; i < l; i++) {
                        if (r = check_position(this, other.pieces[i])) {
                            break
                        }
                    }
                    
                }
                if (r) {
                    this.rmove(r[0], r[1])
                }
                return r
            },
            hitTest: function(point) {
                if (this.hide) {
                    return
                }
                var s = this.size;
                ctx.save();
                this.setTransform(ctx);
                this.draw_path(ctx);
                ctx.restore();
                return ctx.isPointInPath(point.x, point.y)
            }
        }),
        Group = Cevent.Shape.extend({
            type: "group",
            init: function() {
                this.pieces = [];
                this._super(0, 0)
            },
            draw: function(ctx) {
                if (this.hide) {
                    return
                }
                var i, l = this.pieces.length;
                for (i = 0; i < l; i++) {
                    this.pieces[i].draw(ctx)
                }
            },
            hitTest: function(point) {
                var i, l = this.pieces.length;
                for (i = 0; i < l; i++) {
                    if (this.pieces[i].hitTest(point)) {
                        return true
                    }
                }
            },
            check: function(other) {
                var i, l = this.pieces.length,
                    r;
                if (other.type == "piece") {
                    for (i = 0; i < l; i++) {
                        if (r = check_position(this.pieces[i], other)) {
                            this.rmove(r[0], r[1]);
                            return true
                        }
                    }
                } else {
                    var j, l2 = other.pieces.length;
                    for (i = 0; i < l; i++) {
                        for (j = 0; j < l2; j++) {
                            if (r = check_position(this.pieces[i], other.pieces[j])) {
                                this.rmove(r[0], r[1]);
                                return true
                            }
                        }
                    }
                }
            },
            rmove: function(x, y) {
                var i, l = this.pieces.length;
                for (i = 0; i < l; i++) {
                    this.pieces[i].rmove(x, y)
                }
            },
            add: function() {
                this.pieces = this.pieces.concat.apply(this.pieces, arguments)
            }
        });
    Cevent.register("group", Group);
    Cevent.register("piece", Piece)
})();
(function() {
    "use strict";
    var IN = "inside",
        OUT = "outside",
        NONE = null,
        DEFAULT_IMAGE, EDGES = [IN, OUT],
        uuid = 0,
        default_opts = {
            spread: .7,
            offsetTop: 0,
            maxWidth: 705,
            maxHeight: 470,
            defaultImage: "images/puzzle/scottwills_meercats.jpg",
            piecesNumberTmpl: "%d Pieces",
            redirect: "",
            border: true,
            defaultPieces: 10,
            shuffled: false,
            rotatePieces: true
        };

    function random_edge() {
        return EDGES[Util.randint(2)]
    }

    function $(id) {
        return document.getElementById(id)
    }
    
    window.jigsaw = {};
    jigsaw.Jigsaw = Class.extend({
        init: function(opts) {
            var eventBus = new EventEmitter,
                self = this;
            this.opts = opts = Util.extend(opts || {}, default_opts);
            this.max_width = opts.maxWidth;
            this.max_height = opts.maxHeight;
            $("redirect-form").action = opts.redirect;
            DEFAULT_IMAGE = opts.defaultImage;
            this.eventBus = eventBus;
            this.ce = new Cevent("canvas");
            this.ui = new jigsaw.UI(eventBus, opts.defaultPieces || 10);
            this.tmp_img = document.createElement("img");
            this.img = document.getElementById("image");
            this.ctx = Util.getContext(this.img);
            this.preview = document.getElementById("image-preview");
            this.previewCtx = Util.getContext(this.preview);
            this.parts = opts.defaultPieces || 10;
            this.tmp_img.onload = function() {
                self.original = this;
                self.draw_image(this);
                Util.calcPieces(self.img, self.opts.piecesNumberTmpl);
                self.render()
            };
            this.tmp_img.onerror = function() {
                if (DEFAULT_IMAGE) {
                    self.set_image(DEFAULT_IMAGE)
                }
            };
            jigsaw_events(this.ce, eventBus, this.opts.rotatePieces);
            eventBus.on(jigsaw.Events.JIGSAW_COMPLETE, function() {
                self.ui.stop_clock();
                if (opts.redirect) {
                    self.redirect()
                } else {
                    self.ui.show_time()
                }
            });
            if (opts.shuffled) {
                eventBus.on(jigsaw.Events.RENDER_FINISH, this.shuffle.bind(this))
            }
            eventBus.on(jigsaw.Events.PARTS_NUMBER_CHANGED, this.set_parts.bind(this));
            eventBus.on(jigsaw.Events.RENDER_REQUEST, this.render.bind(this));
            eventBus.on(jigsaw.Events.JIGSAW_SHUFFLE, this.shuffle.bind(this));
            eventBus.on(jigsaw.Events.JIGSAW_SET_IMAGE, this.set_image.bind(this));
            eventBus.on(jigsaw.Events.SHOW_EDGE, function() {
                self.ce.find("#middle").attr("hide", true);
                self.ce.find("#edge").attr("hide", false);
                self.ce.redraw()
            });
            eventBus.on(jigsaw.Events.SHOW_MIDDLE, function() {
                self.ce.find("#middle").attr("hide", false);
                self.ce.find("#edge").attr("hide", true);
                self.ce.redraw()
            });
            eventBus.on(jigsaw.Events.SHOW_ALL, function() {
                self.ce.find("*").attr("hide", false);
                self.ce.redraw()
            });

            function resizeView() {
                var cv1 = self.ce.cv;
                cv1.width = document.documentElement.clientWidth, cv1.height = document.documentElement.clientHeight - 45;
                self.ce.redraw();
                if (Cevent.isTouchDevice) {
                    Util.fullScreen()
                }
            }
            resizeView();
            Util.addEvent(window, "resize", resizeView);
            this.set_image()
        },
        redirect: function() {
            $("t").value = this.ui.time();
            $("p").value = this.parts;
            $("redirect-form").submit()
        },
        set_parts: function(n) {
            this.parts = n
        },
        set_image: function(src) {
            this.ce.cv.className = "loading";
            this.tmp_img.src = src || DEFAULT_IMAGE
        },
        draw_image: function(img, w, h) {
            var max_w = w || this.max_width,
                max_h = h || this.max_height,
                width, height, ctx = this.ctx;
            if (max_w > window.innerWidth || max_h > window.innerHeight - 50) {
                var ratio = Math.min(window.innerWidth / max_w, (window.innerHeight - 50) / max_h);
                max_w *= ratio;
                max_h *= ratio
            }
            if (img.width > max_w || img.height > max_h) {
                var rate = Math.min(max_w / img.width, max_h / img.height);
                width = ctx.canvas.width = ~~(img.width * rate);
                height = ctx.canvas.height = ~~(img.height * rate);
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, width, height)
            } else {
                ctx.canvas.width = img.width;
                ctx.canvas.height = img.height;
                ctx.drawImage(img, 0, 0)
            }
        },
        clear: function() {
            this.ce._shapes = []
        },
        shuffle: function() {
            var T = this.ce.getAll("piece");
            if (!this.__pieces) {
                return
            } else {
                this.ce._shapes = T = this.__pieces.slice(0)
            }
            var i, l = T.length,
                F, s = T[0].size,
                ratio = this.opts.spread,
                width = document.documentElement.clientWidth,
                height = document.documentElement.clientHeight - 50,
                w = document.documentElement.clientWidth * ratio,
                h = (document.documentElement.clientHeight - 50) * ratio,
                padx = ~~((width - w) / 2),
                pady = ~~((height - h) / 2);
            for (i = 0; i < l; i++) {
                F = T[i];
                F.tx = Util.randint(w) + F.tx % 1 + padx;
                F.ty = Util.randint(h) + F.tx % 1 + pady;
                /*
                if (this.opts.rotatePieces) {
                    F.rotation = Util.randint(4) * 90
                }*/
            }
            if (this.opts.shuffled) {
                this.ce.cv.className = "";
                this.ui.init_clock()
            }
            this.ce.shuffled = true;
            this.ce.redraw()
        },
        render: function() {
            if (this.opts.shuffled) {
                this.ce.cv.className = "loading";
                this.ce.clear();
                this.ui.stop_clock()
            } else {
                this.ce.cv.className = ""
            }
            this.ce.shuffled = false;
            var top, right, bottom, left, current_right = [],
                last_right = [],
                w = this.img.width,
                h = this.img.height,
                size = ~~Math.sqrt(w * h / this.parts),
                cols = ~~(w / size),
                rows = ~~(h / size),
                i = 0,
                j = 0,
                flag = ++uuid,
                offset;
            this.flag = flag;
            while (cols * rows < this.parts) {
                size--;
                cols = ~~(w / size);
                rows = ~~(h / size)
            }
            size = size % 2 ? size : size - 1;
            offset = ~~(document.documentElement.clientWidth / 2 - size * cols / 2);
            this.clear();
            var ox = ~~((w - cols * size) / 2),
                oy = ~~((h - rows * size) / 2);
            ox = ox >= 0 ? ox : 0;
            oy = oy >= 0 ? oy : 0;
            this.preview.style.marginTop = this.opts.offsetTop + "px";
            this.preview.width = size * cols;
            this.preview.height = size * rows;
            this.previewCtx.drawImage(this.img, ox, oy, size * cols, size * rows, 0, 0, size * cols, size * rows);
            (function F() {
                if (i < cols && flag == this.flag) {
                    if (j < rows) {
                        top = j == 0 ? NONE : bottom == IN ? OUT : IN;
                        right = i == cols - 1 ? NONE : random_edge();
                        bottom = j == rows - 1 ? NONE : random_edge();
                        left = i == 0 ? 0 : last_right[j] == IN ? OUT : IN;
                        this.ce.piece(size * i, size * j + this.opts.offsetTop, window.G_vmlCanvasManager ? this.tmp_img : this.img, size, [top, right, bottom, left]).attr({
                            col: i,
                            row: j,
                            offset: offset,
                            stroke: this.opts.border ? "black" : ""
                        }).get(-1).render(ox, oy - this.opts.offsetTop);
                        if (!this.opts.shuffled) {
                            this.ce.redraw()
                        }
                        if (j == 0 || i == 0 || i == cols - 1 || j == rows - 1) {
                            this.ce.addId("edge")
                        } else {
                            this.ce.addId("middle")
                        }
                        current_right.push(right);
                        j++
                    } else {
                        i++;
                        j = 0;
                        last_right = current_right;
                        current_right = []
                    }
                    setTimeout(F.bind(this), 20);
                    return
                } else if (this.flag == flag) {
                    this.__pieces = this.ce.get().slice(0);
                    this.ce.redraw();
                    this.eventBus.emit(jigsaw.Events.RENDER_FINISH)
                }
            }).bind(this)()
        }
    });

    function jigsaw_events(ce, eventBus, rotate) {
        ce.drag("*", {
            start: function(c, e) {
                c.cv.style.cursor = "move"
            },
            end: function(c, e) {
                c.cv.style.cursor = "default";
                if (!c.shuffled) {
                    return
                }
                var all = c.getAll("piece").concat(c.getAll("group")),
                    i = 0,
                    l = all.length,
                    that = this;
                for (; i < l; i++) {
                    if (all[i] === this) {
                        continue
                    }
                    if (that.check(all[i])) {
                        c.remove(that);
                        c.remove(all[i]);
                        c._curHover = c.group().get(-1);
                        c._curHover.add(that.pieces || that, all[i].pieces || all[i]);
                        that = c._curHover;
                        c.focused = null
                    }
                }
                if (!ce.getAll("piece").length && ce.getAll("group").length == 1 && ce.shuffled) {
                    ce.shuffled = false;
                    eventBus.emit(jigsaw.Events.JIGSAW_COMPLETE)
                }
                if (that.type == "group") {
                    c.remove(that);
                    c._shapes.unshift(that)
                }
            }
        }).focus("*", function(c, e) {
            c.remove(this);
            c._shapes.push(this)
        });
        Util.addEvent(ce.cv, "contextmenu", function(e) {
            if (rotate && ce.focused) {
                ce.focused.rotation = (ce.focused.rotation + 45) % 360;
                ce.redraw()
            }
            e.preventDefault()
        });
        if (!rotate) {
            return
        }
        ce.keydown("right", function() {
            if (this.focused) {
                this.focused.rotation = (this.focused.rotation + 45) % 360
            }
            return false
        }).keydown("left", function() {
            if (this.focused) {
                this.focused.rotation = (this.focused.rotation - 45) % 360
            }
            return false
        });
        if (Cevent.isTouchDevice) {
            ce.click("*", function(c, e) {
                if (ce.focused) {
                    ce.focused.rotation = (ce.focused.rotation + 45) % 360;
                    ce.redraw()
                }
            })
        }
    }
    EventEmitter.mixin(jigsaw.Jigsaw)
})();
(function() {
    "use strict";
    var $ = function(id) {
            return document.getElementById(id)
        },
        uuid = 0;
    jigsaw.UI = Class.extend({
        init: function(eventBus, parts) {
            var self = this;
            this.eventBus = eventBus;
            //this.clock = $("clock");
            //$("set-parts").value = parts;
            init_events(this, eventBus);
            eventBus.on(jigsaw.Events.JIGSAW_SHUFFLE, this.init_clock.bind(this));
            eventBus.on(jigsaw.Events.SHOW_PREVIEW, this.show_preview.bind(this));
            eventBus.on(jigsaw.Events.SHOW_HELP, this.show_help.bind(this));
            eventBus.on(jigsaw.Events.SHOW_FILEPICKER, this.show_filepicker.bind(this))
        },
        stop_clock: function() {
            uuid++
        },
        init_clock: function() {
            var self = this;
            this.ini = (new Date).getTime();
            this.uuid = uuid;
            (function F() {
                if (self.uuid == uuid) {
                    self.clock.innerHTML = self.time();
                    setTimeout(F, 1e3)
                }
            })()
        },
        show_preview: function() {
            var canvas = $("image-preview");
            canvas.className = "show";
            canvas.style.marginLeft = -(canvas.width / 2) + "px";
        },
        show_time: function() {
            this.show_modal("congrat");
            
            //$("time").innerHTML = this.clock.innerHTML;
            //$("time-input").value = this.clock.innerHTML
        },
        time: function() {
            var t = ~~(((new Date).getTime() - this.ini) / 1e3),
                s = t % 60,
                m = ~~(t / 60),
                h = ~~(m / 60);
            m %= 60;
            return (h > 9 ? h : "0" + h) + ":" + (m > 9 ? m : "0" + m % 60) + ":" + (s > 9 ? s : "0" + s)
        },
        show_modal: function(id) {
            game.Modal.open(id)
        },
        show_filepicker: function() {
            this.show_modal("create-puzzle")
        },
        show_help: function() {
            this.show_modal("help")
        }
    });

    function init_events(self, eventBus) {
        function handleFiles(files) {
            var file = files[0];
            if (!file.type.match(/image.*/)) {
                $("image-error").style.display = "block";
                return
            }
            var reader = new FileReader;
            reader.onloadend = function(e) {
                eventBus.emit(jigsaw.Events.JIGSAW_SET_IMAGE, this.result);
                close_lightbox()
            };
            reader.readAsDataURL(file)
        }
        if (window.FileReader && (new FileReader).onload === null) {
            //$("create").style.display = "block";
            Util.$("image-input").change(function() {
                handleFiles(this.files)
            });
            if ("ondragenter" in window && "ondrop" in window) {
                $("dnd").style.display = "block";
                document.addEventListener("dragenter", function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    return false
                }, false);
                document.addEventListener("dragover", function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    return false
                }, false);
                document.addEventListener("drop", function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    var dt = e.dataTransfer;
                    handleFiles(dt.files)
                }, false)
            }
        }

        function close_lightbox() {
            game.Modal.close();
            return false
        }
        /*
        Util.$("set-parts").change(function() {
            eventBus.emit(jigsaw.Events.PARTS_NUMBER_CHANGED, +this.value);
            eventBus.emit(jigsaw.Events.RENDER_REQUEST)
        });
        Util.$("game-options")[Cevent.isTouchDevice ? "touchstart" : "click"]("a", function(e) {
            if (jigsaw.Events[this.id]) {
                e.preventDefault();
                eventBus.emit(jigsaw.Events[this.id])
            }
        })
        */
    }
})();
(function() {
    jigsaw.Events = {
        PARTS_NUMBER_CHANGED: "PartsNumberChanged",
        RENDER_REQUEST: "RenderRequestEvent",
        RENDER_FINISH: "RenderFinishEvent",
        JIGSAW_RENDERED: "JigsawRenderedEvent",
        JIGSAW_SET_IMAGE: "JigsawSetImageEvent",
        JIGSAW_SHUFFLE: "JigsawShuffleEvent",
        SHOW_PREVIEW: "JigsawShowPreview",
        SHOW_HELP: "JigsawShowHelp",
        SHOW_FILEPICKER: "JigsawShowFilepicker",
        SHOW_EDGE: "ShowEdgeEvent",
        SHOW_MIDDLE: "ShowMiddleEvent",
        SHOW_ALL: "ShowAllEvent",
        JIGSAW_COMPLETE: "JigsawCompleteEvent"
    }
})();
(function(document, window, undefined) {
    "use strict";
    var $ = function(id) {
            return document.getElementById(id)
        },
        $modal = $("modal-window"),
        $msg = $("modal-window-msg"),
        $close = $("modal-window-close"),
        $overlay = $("overlay");

    function replace(text, tmpl) {
        var i;
        for (i in tmpl) {
            if (tmpl.hasOwnProperty(i)) {
                text = text.replace(new RegExp("{{" + i + "}}", "gi"), tmpl[i])
            }
        }
        return text
    }

    function showModal(id, tmpl) {
        var style = $modal.style,
            elem = $(id);
        elem.className = "";
        game.Modal.currentContent = elem;
        $msg.appendChild(elem);
        var width = $modal.offsetWidth;
        style.marginLeft = -width / 2 + "px";
        $modal.className = "modal";
        $overlay.className = ""
    }

    function closeModal(e) {
        e && e.preventDefault();
        $modal.className = "modal hide";
        $overlay.className = "hide";
        var current = game.Modal.currentContent;
        setTimeout(function() {
            if (!current) return;
            current.className = "hide";
            document.body.appendChild(current)
        }, 600);
        return false
    }
    var event = Cevent.isTouchDevice ? "touchstart" : "click";
    Cevent.addEventListener($overlay, event, closeModal);
    Cevent.addEventListener($close, event, closeModal);
    window.game = window.game || {};
    game.Modal = {
        open: showModal,
        close: closeModal
    }
})(document, window);
(function(document, window, undefined) {
    function parseQueryString() {
        if (location.query) {
            return
        }
        var parts = location.search.replace(/^[?]/, "").split("&"),
            i = 0,
            l = parts.length,
            GET = {};
        for (; i < l; i++) {
            if (!parts[i]) {
                continue
            }
            part = parts[i].split("=");
            GET[unescape(part[0])] = unescape(part[1])
        }
        return GET
    }
    jigsaw.GET = parseQueryString()
})(document, window);



(function() {
    var jsaw = new jigsaw.Jigsaw({
            defaultImage: "jose.jpg",
            piecesNumberTmpl: "%d Pieces"
        });
    if (jigsaw.GET["image"]) { jsaw.set_image(jigsaw.GET["image"]); }    
    var startButton = document.getElementById('startButton'),
        startButton2 = document.getElementById('startButton2'),
	    startButton3 = document.getElementById('startButton3'),
        startButton4 = document.getElementById('startButton4'),
        startButton5 = document.getElementById('startButton5'),
        glasspane = document.getElementById('glasspane'),
        paused = true;

    var x12 = document.getElementById('x12'),
        x20 = document.getElementById('x20'),
        x30 = document.getElementById('x30'),
        x48 = document.getElementById('x48'),
        x54 = document.getElementById('x54');

    glasspane.onmousedown = function(e) {
       e.preventDefault();
       e.stopPropagation();
    };

    x12.onclick = x20.onclick = x30.onclick = x48.onclick = x54.onclick = function(e){
        var str = this.innerHTML;                
        jsaw.ce.clear();
        jsaw.set_parts(eval(str));
        jsaw.render();
        jsaw.ui.show_preview();
        window.setTimeout(function() {
            jsaw.shuffle();
        }, 2000);
    };
    startButton.onclick = startButton2.onclick = startButton3.onclick = startButton4.onclick = startButton5.onclick = function(e) {        
        jsaw.ce.clear();
        jsaw.set_image(this.src);        
        jsaw.ui.show_preview();
        window.setTimeout(function() {
            jsaw.shuffle();
        }, 2000);
    };
}());

