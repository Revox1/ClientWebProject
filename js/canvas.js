
var lastClick = [0, 0];
var canvas_img;

var hist = {
    redo_list: [],
    undo_list: [],
    image:null,
    saveState: function (canvas, list, keep_redo) {
        keep_redo = keep_redo || false;
        if (!keep_redo) {
            this.redo_list = [];
        }

        (list || this.undo_list).push(canvas.toDataURL());
    },
    undo: function (canvas, ctx) {
        this.restoreState(canvas, ctx, this.undo_list, this.redo_list);
    },
    redo: function (canvas, ctx) {
        this.restoreState(canvas, ctx, this.redo_list, this.undo_list);
    },
    restoreState: function (canvas, ctx, pop, push) {
        if (pop.length) {
            this.saveState(canvas, push, true);
            var restore_state = pop.pop();
            var img = document.createElement('img');
            img.setAttribute("src", restore_state);
            img.onload = function () {
                ctx.clearRect(0, 0, 600, 400);//momentan harcodate
                ctx.drawImage(img, 0, 0, 600, 400, 0, 0, 600, 400);
            }
        }
    },
    clear: function (canvas, ctx) {
        ctx.clearRect(0, 0, 600, 400);
        ctx.drawImage(this.image, 0, 0, 600, 400, 0, 0, 600, 400)
    }
};
function add_hovered_img(img)
{
    var base_image = new Image();
    base_image.setAttribute('crossOrigin', 'anonymous');
    base_image.src =img;
    document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.imageChangePropModalID[0]).src=img;
    base_image.onload = function(){
        ctx =document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id).getContext('2d');
        ctx.clearRect(0, 0, 600, 400);
        ctx.drawImage(base_image, 0, 0, 600, 400, 0, 0, 600, 400);
        hist.image=base_image;
    }
}
function drawLine(e) {
    context = this.getContext('2d');
    x = e.clientX - document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id).getBoundingClientRect().x;
    y = e.clientY - document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id).getBoundingClientRect().y;
    hist.saveState(document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id), history.undo_list, true);
    if (lastClick[0] === 0 && lastClick[1] === 0) {
        lastClick[0] = x;
        lastClick[1] = y;
    } else {
        context.lineWidth = 5;
        context.beginPath();
        context.moveTo(lastClick[0], lastClick[1]);
        context.lineTo(x, y);
        context.strokeStyle = '#bd5db2';
        context.stroke();
        lastClick = [x, y];
    }


};