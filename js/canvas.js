var lastClick = [0, 0];
var modifications = {deletedShapes: [], urls: null};
var hist = {
    shapes_added: 0,
    currentUser: null,
    currentShapes: {},
    globalShapes:{},
    global_urls:{},
    current_urls: {},
    redo_list: [],
    undo_list: [],
    save_points: [],
    redo_undo_points: [],
    image: null,
    saveState: function (canvas, list, keep_redo) {
        keep_redo = keep_redo || false;
        if (!keep_redo) {
            this.redo_list = [];
        }

        (list || this.undo_list).push(canvas.toDataURL());
    },
    undo: function (canvas, ctx) {
        this.restoreState(canvas, ctx, this.undo_list, this.redo_list);

        if (hist.save_points.length) {
            hist.redo_undo_points.push(hist.save_points.pop(), hist.save_points.pop())
        }

    },
    redo: function (canvas, ctx) {

        this.restoreState(canvas, ctx, this.redo_list, this.undo_list);
        if (hist.redo_undo_points.length) {
            hist.save_points.push(hist.redo_undo_points.pop(), hist.redo_undo_points.pop());
        }

    },
    restoreState: function (canvas, ctx, pop, push) {
        if (pop.length) {
            this.saveState(canvas, push, true);
            var restore_state = pop.pop();
            var img = document.createElement('img');
            img.setAttribute("src", restore_state);
            img.onload = function () {

                ctx.clearRect(0, 0, hist.image.width, hist.image.height);
                ctx.drawImage(img, 0, 0, hist.image.width, hist.image.height);
            }
        }
    },
    clear: function (canvas, ctx) {

        ctx.clearRect(0, 0, hist.image.width, hist.image.height);
        ctx.drawImage(hist.image, 0, 0, hist.image.width, hist.image.height);
        lastClick = [0, 0];
        hist.save_points = [];
        hist.redo_undo_points = [];
        hist.redo_list = [];
        hist.undo_list = [];
    }
};

function add_hovered_img(img) {
    var base_image = new Image();
    base_image.setAttribute('crossOrigin', 'anonymous');
    base_image.src = img;
    document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.imageChangePropModalID[0]).src = img;
    base_image.onload = function () {
        let canvas = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id);
        ctx = canvas.getContext('2d');
        canvas.width = base_image.width;
        canvas.height = base_image.height;
        canvas.style.width = base_image.width;
        canvas.style.height = base_image.height;
        ctx.clearRect(0, 0, base_image.width, base_image.height);
        ctx.drawImage(base_image, 0, 0, base_image.width, base_image.height);
        hist.image = base_image;
        hist.redo_list = [];
        hist.undo_list = [];
        hist.savePoints = [];
        hist.redo_undo_points = [];
        modifications.deletedShapes = [];
        modifications.urls = null;
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
        hist.save_points.push(lastClick[0], lastClick[1]);
        context.lineTo(x, y);
        context.strokeStyle = '#bd5db2';
        context.stroke();
        lastClick = [x, y];
    }


};
