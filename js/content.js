var current_img_event;
function change_comments() {
    document.getElementById(constants.popoverID).shadowRoot
        .getElementById(constants.select_comment_id)
        .addEventListener('change', function (e) {
            var options = document.getElementById(constants.popoverID).shadowRoot.querySelectorAll('.casuta-comment');
            var target = document.getElementById(constants.popoverID).shadowRoot.getElementById(e.target.value);
            console.log(target, e.target.value);
            for (i = 0; i < options.length; i++) {
                options[i].classList.remove("shown");
            }
            if (e.target.value === "objectAll") {
                for (i = 0; i < options.length; i++) {
                    options[i].classList.add("shown");
                }
            }
            else {
                target.classList.add("shown");
            }
        });
}

function findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls)) ;
    return el;
}

function load_url_for_images(ids, urls) {
    var img;
    for (var i = 0; i < ids.length; i++) {
        img = document.getElementById(constants.popoverID).shadowRoot.getElementById(ids[i]);
        img.src = chrome.extension.getURL(urls[i]);
    }
}

function httpGetAsynca(theUrl, callback) {
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.onreadystatechange = function () {
        if (xmlHttp.readyState === 4 && xmlHttp.status === 200)
            callback(xmlHttp.responseText);
    };
    xmlHttp.open("GET", chrome.extension.getURL(theUrl), true); // true for asynchronous
    xmlHttp.send(null);
}

function setCssClass(event, className) {
    var img;
    img = document.getElementById(constants.popoverID).shadowRoot.getElementById("modalImage");
    if (img.classList.contains(className)) {
        img.classList.remove(className);
    }
    else {
        img.classList.add(className);
    }
}

function positionPopupOnPage(event, popover) {
    var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
    var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    var vpWH = [];
    var vpW, vpH;
    var intCoordX = event.clientX;
    var intCoordY = event.clientY;
    var intXOffset = intCoordX;
    var intYOffset = intCoordY;

    vpWH = getViewPortWidthHeight();
    vpW = vpWH[0];
    vpH = vpWH[1];

    popover.style.display = 'block';
    if (intCoordX > vpW / 2) {
        intXOffset -= popover.offsetWidth;
    }
    if (intCoordY > vpH / 2) {
        intYOffset -= popover.offsetHeight;
    }


    popover.style.top = (intYOffset + scrollTop) + 'px';
    popover.style.left = (intXOffset + scrollLeft) + 'px';

}

function add_listeners_for_canvas() {
    var canvas = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id);
    canvas.addEventListener('click', drawLine, false);
    document.getElementById(constants.popoverID).shadowRoot.getElementById('undo').addEventListener('click', function (e) {
        hist.undo(canvas, canvas.getContext('2d'));
    });
    document.getElementById(constants.popoverID).shadowRoot.getElementById('redo').addEventListener('click', function (e) {
        hist.redo(canvas, canvas.getContext('2d'));
    });
    document.getElementById(constants.popoverID).shadowRoot.getElementById('clear').addEventListener('click', function (e) {
        hist.clear(canvas, canvas.getContext('2d'));
    });
    document.getElementById(constants.popoverID).shadowRoot.getElementById('delete').addEventListener('click', function (e) {

        if (hist.currentUser) {
            var alt = document.getElementById(constants.popoverID).shadowRoot.getElementById("slct");
            var strUser = alt.options[alt.selectedIndex].value;
            var ok = 1;
            if (strUser != "default") {
                for (var mod in modifications.deletedShapes) {
                    if (modifications.deletedShapes[mod] === strUser) {
                        ok = 0;
                    }
                }
                if (ok) {
                    modifications.deletedShapes.push(strUser)
                }
            }
        }
    });
}

function add_listener_for_save_button() {
    document.getElementById(constants.popoverID).shadowRoot.getElementById("save_button").addEventListener('click', function (e) {
        if (hist.currentUser) {
            if (hist.save_points.length > 4) {
                if (!hist.currentShapes[hist.image.src]) {
                    hist.currentShapes[hist.image.src] = []
                }
                var select = document.getElementById(constants.popoverID).shadowRoot.getElementById("slct");
                if (select.options[select.selectedIndex].value !== "default") {
                    hist.currentShapes[hist.image.src][select.options[select.selectedIndex].value] = hist.save_points;
                }
                else {
                    hist.currentShapes[hist.image.src][hist.currentShapes[hist.image.src].length] = hist.save_points;
                }
            }
            else {
                //html warning
            }

            if (modifications.deletedShapes.length > 0) {
                for (var dele in modifications.deletedShapes) {
                    hist.currentShapes[hist.image.src].splice(modifications.deletedShapes[dele], 1)
                }
                modifications.deletedShapes = [];
            }
            add_shapes_img(hist.image.src);
            hist.clear(document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id), document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id).getContext('2d'))

            chrome.runtime.sendMessage({
                task: "save",
                polygons: hist.currentShapes[hist.image.src],
                src: hist.image.src
            }, function (request) {
                // changes_to_modal(request)
                get_info_from_background();
            });
        }


    });
}

//todo completely refactor this
function openTab(evt, tabName) {

    var i, tabcontent, tablinks;
    tabcontent = document.getElementById(constants.popoverID).shadowRoot.querySelectorAll(".tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("shown");
    }
    tablinks = document.getElementById(constants.popoverID).shadowRoot.querySelectorAll(".tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(constants.popoverID).shadowRoot.getElementById(tabName).classList.add("shown");
    evt.currentTarget.className += " active";
}


function getViewPortWidthHeight() {

    var viewPortWidth;
    var viewPortHeight;

    if (typeof window.innerWidth !== undefined) {
        viewPortWidth = window.innerWidth;
        viewPortHeight = window.innerHeight;
    }

    // IE6 in standards compliant mode (i.e. with a valid doctype as the
    // first line in the document)
    else if (typeof document.documentElement !== undefined && typeof document.documentElement.clientWidth !== undefined && document.documentElement.clientWidth !== 0) {
        viewPortWidth = document.documentElement.clientWidth;
        viewPortHeight = document.documentElement.clientHeight;
    }

    return [viewPortWidth, viewPortHeight];
}	// end fn getViewPortWidthHeight

function get_info_from_background() {

    chrome.runtime.sendMessage({task: "get"}, function (request) {
        console.log(request);

        changes_to_modal(request);

        for (var img_url in request.imgs) {
            hist.currentShapes[img_url] = request.imgs[img_url].shapes;
        }
        populate_images_with_maps();

    });


}

function populate_images_with_maps() {
    for (let img in hist.currentShapes) {
        let currentImage = document.querySelector(`img[src='${img}']`);
        currentImage.useMap = '#' + img;

        let innerhtml = `<map name="${img}">`;
        for (let shape in hist.currentShapes[img]) {
            innerhtml += `<div class="area"><area shape="poly" coords="${hist.currentShapes[img][shape]}"  href="sun.htm"><div>`
        }
        innerhtml += "</map>";
        currentImage.innerHTML = innerhtml;
        //aici pt hover si click
    }

}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(2, request, sender)
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");

        changes_to_modal(request);
        if (request.info != null) {
            get_info_from_background()
        }
        else {

        }
        // window.location.reload(true)


    });

function changes_to_modal(request) {
    if (typeof request != "undefined" && typeof request.info != "undefined" && request.info) {
        hist.currentUser = request.info;
        document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.currentName).textContent = request.info.displayName;
        document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.logged).style.display = "none";
        document.getElementById(constants.popoverID).shadowRoot.getElementById("select_shape").style.display = "block";

    }
    else {
        hist.currentUser = null;
        document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.currentName).textContent = "Anonymous";
        document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.logged).style.display = "flex";
        document.getElementById(constants.popoverID).shadowRoot.getElementById("select_shape").style.display = "none";
    }

}

function add_shapes_img(src) {
    //clear modifications
    var select = document.getElementById(constants.popoverID).shadowRoot.getElementById("slct");
    select.innerHTML = "<option value=\"default\">Current Shape</option>";

    for (var option in hist.currentShapes[src]) {
        select.innerHTML += `<option value="${option}">Shape ${option}</option>`;
    }
    select.addEventListener("change", function () {
        if (select.value != "default") {
            var canvas = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id);
            var context = canvas.getContext('2d');
            hist.clear(canvas, context);
            context.lineWidth = 5;
            context.strokeStyle = '#bd192e';
            for (var i = 0; i < hist.currentShapes[hist.image.src][select.value].length - 2; i += 2) {

                context.beginPath();
                context.moveTo(hist.currentShapes[hist.image.src][select.value][i], hist.currentShapes[hist.image.src][select.value][i + 1]);
                context.lineTo(hist.currentShapes[hist.image.src][select.value][i + 2], hist.currentShapes[hist.image.src][select.value][i + 3]);
                context.stroke();
            }
            context.beginPath();
            context.moveTo(hist.currentShapes[hist.image.src][select.value][i], hist.currentShapes[hist.image.src][select.value][i + 1]);
            context.lineTo(hist.currentShapes[hist.image.src][select.value][0], hist.currentShapes[hist.image.src][select.value][1]);
            context.stroke();

        }
        else {

        }
    });

}

function getPositionofTargetImage(el) {
    var xPos = 0;
    var yPos = 0;
    while (el) {
        xPos += (el.offsetLeft + el.clientLeft);
        yPos += (el.offsetTop + el.clientTop);
        el = el.offsetParent;

    }


    return {
        x: xPos,
        y: yPos
    };
}

function add_listeners(modal, popover, small_box) {
    add_listeners_for_canvas();
    add_listener_for_save_button();

    modal.addEventListener("click", function () {
        popover.style.display = "none"
    });

    small_box.addEventListener("click", function (event) {

        positionPopupOnPage(current_img_event, popover);

    })


}

window.onload = function () {
    var current_popover, small_box, modal, popover;
    console.clear();
    httpGetAsynca("html/extension_popover.html", function (data) {

        var inject = document.createElement("div");
        inject.id = constants.popoverID;
        document.body.insertBefore(inject, document.body.firstChild);

        var shadow = document.getElementById(constants.popoverID).createShadowRoot();
        var inject2 = document.createElement("style");
        httpGetAsynca("css/extension_popover.css", function (data2) {
            inject2.innerHTML = data2;
            shadow.appendChild(inject2);
            inject2 = document.createElement("div");
            inject2.innerHTML = data;
            shadow.appendChild(inject2);
            load_url_for_images(constants.popover_img_ids, constants.popover_img_urls);
            change_comments();
            get_info_from_background();

            popover = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.popoverID2);
            small_box = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.small_box);
            modal = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.modal_button);
            //listeners
            add_listeners(modal, popover, small_box);

            window.addEventListener("mouseover", function (event) {
                if (event.target.tagName === "IMG" && event.target.id != constants.popoverID) {
                    current_img_event = event;
                    var target_positions = getPositionofTargetImage(event.target);
                    small_box.style.top = target_positions.y + "px";
                    small_box.style.left = target_positions.x + "px";
                    small_box.style.display = "block";

                    add_hovered_img(event.target.src);
                    add_shapes_img(event.target.src);
                    current_popover = popover;

                } else {

                    if (small_box != undefined && event.target.id != constants.popoverID) {
                        small_box.style.display = "none";
                    }
                    if (current_popover != undefined && event.target.id !== constants.popoverID) {//null

                        current_popover.style.display = "none";
                        current_popover = null;
                    }
                }
            });
            var buttons = document.getElementById(constants.popoverID).shadowRoot.querySelectorAll('.tablinks');
            var properties = document.getElementById(constants.popoverID).shadowRoot.querySelectorAll('.prop');
            buttons.forEach(function (t) {
                t.addEventListener("click", function (event) {
                    openTab(event, t.innerHTML);
                });
            });
            properties.forEach(function (t) {
                t.addEventListener("click", function (event) {
                    setCssClass(event, t.innerHTML)
                })
            });
            window.addEventListener("scroll", function (e) {
                if (current_popover !== undefined && current_popover.style != null) {
                    current_popover.style.display = "none";
                }

            });
            window.addEventListener("resize", function (e) {
                if (current_popover !== undefined) {
                    small_box.style.display = "none";
                    current_popover.style.display = "none"
                }
            });
        })


    });


}
