var ctx = document.getElementById("canvas").getContext("2d");
ctx.canvas.width = 500;
ctx.canvas.height = 500;
var IN = "inside", OUT = "outside", EDGES = [IN, OUT];

function random_edge() {
    return EDGES[Math.floor((Math.random() * 10) + 1) % 2 ];
}

function outside(ctx, s, cx, cy) {
    ctx.lineTo(cx + s * .34, cy);                
    ctx.bezierCurveTo(cx + s * .504, cy, cx + s * .4, cy + s * -.15, cx + s * .4, cy + s * -.15);
    ctx.bezierCurveTo(cx + s * .3, cy + s * -.3, cx + s * .5, cy + s * -.3, cx + s * .5, cy + s * -.3);
    ctx.bezierCurveTo(cx + s * .7, cy + s * -.3, cx + s * .6, cy + s * -.15, cx + s * .6, cy + s * -.15);
    ctx.bezierCurveTo(cx + s * .5, cy, cx + s * .65, cy, cx + s * .65, cy);
    ctx.lineTo(cx + s, cy);
}

function inside(ctx, s, cx, cy) {
    ctx.lineTo(cx + s * .35, cy);
    ctx.bezierCurveTo(cx + s * .505, cy + .05, cx + s * .405, cy + s * .155, cx + s * .405, cy + s * .1505);
    ctx.bezierCurveTo(cx + s * .3, cy + s * .3, cx + s * .5, cy + s * .3, cx + s * .5, cy + s * .3);
    ctx.bezierCurveTo(cx + s * .7, cy + s * .29, cx + s * .6, cy + s * .15, cx + s * .6, cy + s * .15);
    ctx.bezierCurveTo(cx + s * .5, cy, cx + s * .65, cy, cx + s * .65, cy);
    ctx.lineTo(cx + s, cy);
}

var img = new Image();
img.src = "astohuaraca.jpg";


var Piece = {
    type: "piece",
    init: function(x, y, size, edges) {    	
        this.half_s = size / 2;
        this.size = size;
        this.edges = edges;
        this.tx = x + this.half_s;
        this.ty = y + this.half_s;
        this.x = x;
        this.y = y;        
    },
    move:function(x, y){
        this.x = x;        
        this.y = y;
        this.draw(ctx);
    },
    draw_path: function(ctx) {                
        var s = this.size,
            fn, i = 0;
        ctx.beginPath();
        ctx.moveTo(-this.half_s, -this.half_s);
        for (; i < 4; i++) {
            fn = this.edges[i];            
            if (fn) {
                var cx = eval(fn+"(ctx, s, -this.half_s, -this.half_s)");
            } else {
                ctx.lineTo(this.half_s, this.half_s)
            }
            ctx.rotate(Math.PI / 2);
        }
        ctx.closePath();
    },
    render: function(ox, oy) {
        var s = this.size + .5;        
        ctx.lineWidth = .5;
        ctx.strokeStyle = "#000";   
        ctx.save();
        ctx.translate(this.x, this.y);
        this.draw_path(ctx);
        ctx.stroke();
        ctx.restore();
    },
    draw: function(ctx) {
        if (this.hide) {
            return
        }
        var half_size = this.size / 2 - .5;        
        this.render(this.x, this.y);
        ctx.save();
        ctx.clip();
        ctx.translate(-100, -100);
        ctx.drawImage(this.img, this.x, this.y);
        ctx.restore();
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
};

(function(){
	var piece = Object.create(Piece);
	piece.init(10, 10, "jose.jpg", 100, [random_edge(), random_edge(), random_edge(), random_edge()]);
    piece.move(200, 200);
    ctx.rect(1, 1, 100, 100);
    ctx.stroke();
    //piece.draw(ctx);
})();
