// get canvas related references
var canvas=document.getElementById("canvas");
var ctx=canvas.getContext("2d");
var BB=canvas.getBoundingClientRect();
var offsetX=BB.left;
var offsetY=BB.top;
var WIDTH = canvas.width;
var HEIGHT = canvas.height;
var puzzlewidth,puzzleheight;
var puzzleposx, puzzleposy;

var img = new Image(), savedData = new Image();
img.src = "astohuaraca.jpg";

img.onload = function(){};
savedData.onload = function(){};
    
// drag related variables
var dragok = false;
var dragpiece = -1;
var startX;
var startY;
// an array of objects that define different shapes
var shapes=[];
/*
// define 2 rectangles
shapes.push({x:10,y:100,width:30,height:30,fill:"#444444",isDragging:false});
shapes.push({x:80,y:100,width:30,height:30,fill:"#ff550d",isDragging:false});
// define 2 circles
shapes.push({x:150,y:100,r:10,fill:"#800080",isDragging:false});
shapes.push({x:200,y:100,r:10,fill:"#0c64e8",isDragging:false});
*/
// listen for mouse events
canvas.onmousedown = myDown;
canvas.onmouseup = myUp;
canvas.onmousemove = myMove;

var IN = "inside", OUT = "outside", EDGES = [IN, OUT];

function random_edge() {
    return EDGES[Math.floor((Math.random() * 10) + 1) % 2 ];
}

function edgeopp(e){
    if (e == "inside") return "outside";
    if (e == "outside") return "inside";
    return e;
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

function flat(ctx, s, cx, cy) {
    ctx.lineTo(cx + s, cy);
}

var img = new Image();
img.src = "jose.jpg";


// draw a single rect
function rect(r) {  
  ctx.strokeRect(r.x,r.y,r.width,r.height);
  //ctx.stroke();
}

// draw a single rect
function circle(c) {
  ctx.fillStyle=c.fill;
  ctx.beginPath();
  ctx.arc(c.x,c.y,c.r,0,Math.PI*2);
  ctx.closePath();
  ctx.fill();
}

// clear the canvas
function clear() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);
}


Class = function() {};
Class.extend = function(prop) {
    var _super = this.prototype,
        prototype, name, tmp, ret;
    initializing = true;
    prototype = new this;
    initializing = false;
    for (name in prop) {
        prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" ? function(name, fn) {
            return function() {
                tmp = this._super;
                this._super = _super[name];
                ret = fn.apply(this, arguments);
                this._super = tmp;
                return ret
            }
        }(name, prop[name]) : prop[name]
    }

    function Class(args) {
        if (this instanceof arguments.callee) {
            if (!initializing && this.init) this.init.apply(this, args && args.callee ? args : arguments)
        } else return new arguments.callee(arguments)
    }
    Class.prototype = prototype;
    Class.constructor = Class;
    Class.extend = arguments.callee;
    return Class;
}

Shape = Class.extend({
  init: function (x, y){
    this.x = x;
    this.y = y;
  },
  render : function(){},
  draw: function (){
    this.render();
  },
  in: function(x, y){    
    this.render();    
    var c = ctx.isPointInPath(x, y);
    return c;
  },
  move: function(x, y){
    this.x = x;
    this.y = y;
  }
});

Rectangle = Shape.extend({
  init(x, y, w, h){
    console.log("create");
    this.x = x;
    this.y = y;
    this.width = w;
    this.height = h;
  },
  render:function(){
    ctx.strokeRect(this.x, this.y, this.width, this.height);
  }
});

GUIObject = Class.extend({
  init:function(x,y,w,h){
    this.x = x;    
    this.y = y;    
    this.w = w;    
    this.h = h;    
  },
  draw:function(){
    ctx.strokeRect(this.x,this.y,this.w,this.h);    
  }
});

Button = GUIObject.extend({
  init:function(x, y, c){
    this.caption = c;
    this._super(x, y, 50, 30);
  },
  draw:function(){
    ctx.strokeRect(this.x,this.y,this.w,this.h);
    ctx.font = "12px Arial";
    ctx.fillText(this.caption,this.x, this.y);
  }
});

Piece = Shape.extend({    
    init: function(x, y, size, edges) {     
        this.inplace = false;
        this.half_s = size / 2;
        this.size = size;
        this.edges = edges;
        this.tx = x + this.half_s;
        this.ty = y + this.half_s;
        this.x = x;
        this.y = y;
        this.maxdist = size/5;
        this.posx = x;
        this.posy = y;
        this.isDragging = false;
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
                ctx.lineTo(s, -this.half_s)
            }
            ctx.rotate(Math.PI / 2);
        }
        ctx.closePath();
    },
    render: function() {
        ctx.save();
        ctx.translate(this.x, this.y);
        this.draw_path(ctx);
        ctx.stroke();
        ctx.restore();
    },
    draw: function() {        
        ctx.save();
        ctx.translate(this.x, this.y);
        this.draw_path(ctx);
        ctx.save();
        ctx.clip();
        ctx.translate(-this.posx, -this.posy);
        ctx.drawImage(img, puzzleposx, puzzleposy, puzzlewidth, puzzleheight);
        ctx.restore();
        ctx.stroke();
        ctx.restore();   
        
    },
    inplace:function(){
        return (this.x == this.posx && this.x == this.posy);
    },
    glue:function(){
      var dx = this.x - this.posx,
          dy = this.y - this.posy;
      if ((dx*dx + dy*dy) <= (this.maxdist*this.maxdist)){
        this.x = this.posx;  
        this.y = this.posy; 
        this.inplace = true; 
      }
    },
    drop:function(){
      if (this.isDragging){
        this.isDragging=false;
        this.glue();
      }
    }
});

Puzzle = Class.extend({
  init: function(x, y, sx, sy, pw){
    this.W = sx*pw;
    this.H = sy*pw;
    this.sx = sx;
    this.sy = sy;
    this.pw = pw;
    this.posx = x;
    this.posy = y;
    this.pieces = [];   

    var edges = [];
    for(var i = 0;i<sy;i++){      
      for(var j = 0;j<sx;j++){ 
        edges.push([random_edge(), random_edge(), random_edge(), random_edge()]);
      }
    }    
    // first and last lines 
    for(var i = 0;i<sx;i++){            
      edges[i][0] = "flat";      
      edges[i + (sy-1)*sx][2] = "flat";
    }

    for(var i = 1;i<sx;i++){            
      edges[i][3] = edgeopp(edges[i-1][1]);      
      edges[i + (sy-1)*sx][3] = edgeopp(edges[i -1 + (sy-1)*sx][1]);
    }

    // left and rigth columns
    for(var i = 0;i<sy;i++){            
      edges[i*sx][3] = "flat";      
      edges[(i+1)*sx -1][1] = "flat";      
    }

    for(var i = 1;i<sy;i++){            
      edges[i*sx][0] = edgeopp(edges[(i-1)*sx][2]);
      edges[(i+1)*sx -1][0] = edgeopp(edges[(i)*sx - 1][2]);
    }

    for(var i = 1;i<sy;i++){      
      for(var j = 1;j<sx;j++){ 
        edges[i*sx + j][0] = edgeopp(edges[(i-1)*sx + j][2]);
        edges[i*sx + j][3] = edgeopp(edges[i*sx + j-1][1]);
      }
    }
    for(var i = 0;i<sy;i++){      
      for(var j = 0;j<sx;j++){      
        this.pieces.push(Piece(this.posx + pw*(j + 0.5), this.posy + pw*(i + 0.5), pw, edges[i*sx + j]));    
      }
    }
  },
  draw:function(){
    ctx.globalAlpha = 0.25;
    ctx.drawImage(img, this.posx, this.posy, this.sx*this.pw, this.sy*this.pw);
    ctx.globalAlpha = 1.0;
    
    for(var i = 0;i<this.pieces.length;i++){
      this.pieces[i].draw();
    }    

  },
  start:function(){
    for(var i = 0;i<this.pieces.length;i++){
      this.pieces[i].move(Math.floor(this.pw/2 + Math.random() * (puzzleposx - this.pw)), 
                          Math.floor(this.pw/2 + Math.random() * (HEIGHT - this.pw)));      
      this.pieces[i].inplace = false;
    } 
  },
  won:function(){
    var check = true;
    for(var i = 0;i<this.pieces.length;i++){
      if (!this.pieces[i].inplace){
        check = false;
        break;
      }
    }
    return check;
  }
});

// redraw the scene
function dibujar() {  
  clear();
  puzzle.draw();  
}


// handle mousedown events
function myDown(e){
  // tell the browser we're handling this mouse event
  e.preventDefault();
  e.stopPropagation();

  // get the current mouse position
  var mx=parseInt(e.clientX-offsetX);
  var my=parseInt(e.clientY-offsetY);

  // test each shape to see if mouse is inside
  //dragok=false;
  dragpiece = -1;
  var i = puzzle.pieces.length-1;
  for(;i>=0;i--){
    var s=puzzle.pieces[i];
    // test if the mouse is inside this circle
    if(!s.inplace && s.in(mx, my)){      
      break;
    }
  }
  if (i<puzzle.pieces.length && i>=0){
    var p = puzzle.pieces[i];
    puzzle.pieces.splice(i, 1);
    puzzle.pieces.push(p);
    dragpiece = puzzle.pieces.length - 1;
  }  
  // save the current mouse position
  startX=mx;
  startY=my;  
}


// handle mouseup events
function myUp(e){
  // tell the browser we're handling this mouse event
  e.preventDefault();
  e.stopPropagation();

  // clear all the dragging flags
  //dragok = false;  
  if (dragpiece>=0){
    puzzle.pieces[dragpiece].glue();
    dragpiece = -1;
  }
  /*
  for(var i=0;i<puzzle.pieces.length;i++){
    puzzle.pieces[i].drop();
  }
  */  
  dibujar();
  if (puzzle.won()){
    $( "#dialog" ).dialog({modal:true});
  }
}


// handle mouse moves
function myMove(e){
  // if we're dragging anything...
  if (dragpiece>=0){    
    // tell the browser we're handling this mouse event
    e.preventDefault();
    e.stopPropagation();

    // get the current mouse position
    var mx=parseInt(e.clientX-offsetX);
    var my=parseInt(e.clientY-offsetY);

    // calculate the distance the mouse has moved
    // since the last mousemove
    var dx=mx-startX;
    var dy=my-startY;

    // move each rect that isDragging 
    // by the distance the mouse has moved
    // since the last mousemove
    /*
    for(var i=0;i<puzzle.pieces.length;i++){
      var s=puzzle.pieces[i];
      if(s.isDragging){
        s.move(s.x+dx, s.y+dy);
      }
    }
    */
    var s = puzzle.pieces[dragpiece];
    s.move(s.x+dx, s.y+dy);

    // redraw the scene with the new rect positions    
    dibujar();
    //ctx.drawImage(savedData,0,0);
    //puzzle.pieces[dragpiece].draw();

    // reset the starting mouse position for the next mousemove
    startX=mx;
    startY=my;
  }
}


// Set up touch events for mobile, etc
canvas.addEventListener("touchstart", function (e) {
        mousePos = getTouchPos(canvas, e);
  var touch = e.touches[0];
  var mouseEvent = new MouseEvent("mousedown", {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
}, false);
canvas.addEventListener("touchend", function (e) {
  var mouseEvent = new MouseEvent("mouseup", {});
  canvas.dispatchEvent(mouseEvent);
}, false);
canvas.addEventListener("touchmove", function (e) {
  var touch = e.touches[0];
  var mouseEvent = new MouseEvent("mousemove", {
    clientX: touch.clientX,
    clientY: touch.clientY
  });
  canvas.dispatchEvent(mouseEvent);
}, false);

// Get the position of a touch relative to the canvas
function getTouchPos(canvasDom, touchEvent) {
  var rect = canvasDom.getBoundingClientRect();
  return {
    x: touchEvent.touches[0].clientX - rect.left,
    y: touchEvent.touches[0].clientY - rect.top
  };
}

// Prevent scrolling when touching the canvas
document.body.addEventListener("touchstart", function (e) {
  if (e.target == canvas) {
    e.preventDefault();
  }
}, false);
document.body.addEventListener("touchend", function (e) {
  if (e.target == canvas) {
    e.preventDefault();
  }
}, false);
document.body.addEventListener("touchmove", function (e) {
  if (e.target == canvas) {
    e.preventDefault();
  }
}, false);

var puzzle;
window.onload = function(){   
    
    
    var w = window.innerWidth;
    var h = window.innerHeight;

    var puzzlesizex = 5;
    var puzzlesizey = 4;
    var puzzlepiecesize = 150;

    puzzlewidth = puzzlesizex*puzzlepiecesize;
    puzzleheight = puzzlesizey*puzzlepiecesize;

    var pw2 = puzzlewidth/2;
    var ph2 = puzzleheight/2;

    puzzleposx = w - puzzlewidth;
    puzzleposy = h/2 - ph2;

    ctx.canvas.width  = w;
    ctx.canvas.height = h;

    WIDTH = w;
    HEIGHT = h;

    puzzle = new Puzzle(puzzleposx, puzzleposy, puzzlesizex, puzzlesizey, puzzlepiecesize);
    puzzle.start();

    /*
    shapes.push(Rectangle(10, 10, 30, 30));
    shapes.push(Rectangle(30, 20, 40, 30));
    shapes.push(Piece(150, 150, 100, [random_edge(), random_edge(), random_edge(), random_edge()]));
    shapes.push(Piece(50, 50, 100, [random_edge(), random_edge(), random_edge(), random_edge()]));
    */
    // call to draw the scene
    dibujar();
}

function restartpuzzle(image){
  img = image;
  clear();
  puzzle.start();
  $( "#dialog" ).dialog( "close" );
}
