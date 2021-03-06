var remove_listener = false;
var add_globals = true;

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
        document.getElementById(constants.popoverID).shadowRoot.getElementById("canvas_warning").style.display = "none";
    });
    document.getElementById(constants.popoverID).shadowRoot.getElementById('delete').addEventListener('click', function (e) {

        if (hist.currentUser) {
            var alt = document.getElementById(constants.popoverID).shadowRoot.getElementById("slct");
            var strUser = alt.options[alt.selectedIndex].value;
            var ok = 1;
            if (strUser != "default") {
                for (var mod in modifications.deletedShapes) {
                    if (modifications.deletedShapes[Number(mod)] === strUser) {
                        ok = 0;
                    }
                }
                if (ok) {
                    modifications.deletedShapes.push(Number(strUser))

                }
            }
        }
    });
}

function validateURL(str) {

    var regex = /(http|https):\/\/(\w+:{0,1}\w*)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%!\-\/]))?/;
    if (!regex.test(str)) {
        let warning_text = document.getElementById(constants.popoverID).shadowRoot.getElementById("canvas_warning");
        warning_text.innerText += constants.warnings.canvas["WrongURL"] + "Error:" + str;
        warning_text.style.display = "block";
        return false;
    } else {
        return true;
    }

}

function add_listener_for_save_button() {
    document.getElementById(constants.popoverID).shadowRoot.getElementById("save_button").addEventListener('click', function (e) {


        if (hist.currentUser) {
            var tab_active = document.getElementById(constants.popoverID).shadowRoot.querySelector(".tablinks.active");

            if (tab_active.innerHTML == "Comments") {
                chrome.runtime.sendMessage({
                    task: "save_comments",
                    src: hist.image.src,
                    comments: hist.globalComments[hist.image.src]
                }, function (request) {
                    // changes_to_modal(request)
                    get_info_from_background();
                });
            }
            else {
                if (tab_active.innerHTML == "Properties") {
                    var image = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.imageChangePropModalID[0]);
                    var css_style = window.getComputedStyle(image).getPropertyValue("filter");
                    chrome.runtime.sendMessage({
                        task: "save_css",
                        src: hist.image.src,
                        css: css_style
                    }, function (request) {
                        // changes_to_modal(request)
                        get_info_from_background();
                    });
                }
                else {
                    clear_text();

                    var validation = {
                        shape: false,
                        urls: false
                    };

                    if (modifications.deletedShapes.length > 0) {
                        modifications.deletedShapes = modifications.deletedShapes.sort().reverse();
                        for (var dele in modifications.deletedShapes) {

                            hist.currentShapes[hist.image.src].splice(modifications.deletedShapes[dele], 1)

                        }
                        modifications.deletedShapes = [];
                    }
                    var select = document.getElementById(constants.popoverID).shadowRoot.getElementById("slct");
                    get_input_urls_value(select.options[select.selectedIndex].value, 1);
                    if (hist.shapes_added) {
                        for (var prop in modifications.urls) {

                            if (validateURL(modifications.urls[prop].clicker) && validateURL(modifications.urls[prop].hover)) {
                                if (hist.current_urls[hist.image.src] == undefined) {
                                    hist.current_urls[hist.image.src] = {}
                                }

                                hist.current_urls[hist.image.src][Number(prop)] = {
                                    clicker: modifications.urls[prop].clicker,
                                    hover: modifications.urls[prop].hover
                                };
                                validation.urls = true;

                            } else {
                                //warning wrong urls
                            }
                        }

                        modifications.urls = hist.current_urls[hist.image.src];
                    }
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

                        validation.shape = true;
                    }
                    else {
                        if (validation.urls) {
                            validation.shape = true;
                        }
                        /*
                          warning_text.innerText=constants.warnings.canvas["3points"];
                          warning_text.style.display="block";*/
                        //html warning
                    }
                    add_shapes_img(hist.image.src);
                    hist.clear(document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id), document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id).getContext('2d'))
                    hist.shapes_added = 0;

                    if (validation.shape && validation.urls) {
                        chrome.runtime.sendMessage({
                            task: "save",
                            polygons: hist.currentShapes[hist.image.src],
                            src: hist.image.src,
                            urls: hist.current_urls[hist.image.src]
                        }, function (request) {
                            // changes_to_modal(request)
                            get_info_from_background();
                        });
                    }
                }
            }
            populate_with_comments(hist.image.src)
        }

    });
    document.getElementById(constants.popoverID).shadowRoot.getElementById("share_button").addEventListener("click", function (e) {
            if (hist.currentUser) {
                hist.global_urls = hist.current_urls;
                hist.globalShapes = hist.currentShapes;
                chrome.runtime.sendMessage({
                    task: "save_global",
                    polygons: hist.currentShapes[hist.image.src],
                    src: hist.image.src,
                    urls: hist.current_urls[hist.image.src]
                }, function (request) {
                    // changes_to_modal(request)
                    //get_info_from_background();
                });

            }
        }
    );


}

function clear_text() {
    let warning_text = document.getElementById(constants.popoverID).shadowRoot.getElementById("canvas_warning");
    warning_text.innerText = "";
    warning_text.style.display = "none";

    document.getElementById(constants.popoverID).shadowRoot.getElementById("click_url").innerText = "";
    input_hover = document.getElementById(constants.popoverID).shadowRoot.getElementById("img_url").innerText = "";
}

//todo completely refactor this
function openTab(evt, tabName) {
    clear_text()
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
        if (request.sign === true) {
            remove_listener = false;
        } else {
            remove_listener = true;
        }
        if (request.global1 === true) {
            add_globals = true;
        } else {
            add_globals = false;

        }
        changes_to_modal(request);
        if (request.imgs) {
            for (var img_url in request.imgs) {

                hist.currentShapes[img_url] = request.imgs[img_url].shapes;
                hist.current_urls[img_url] = request.imgs[img_url].urls;
                hist.css[img_url] = request.imgs[img_url].css;

            }
        }
        for (var img_url in request.global) {
            hist.globalShapes[img_url] = request.global[img_url].shapes;
            hist.global_urls[img_url] = request.global[img_url].urls;
            hist.globalComments[img_url] = request.global[img_url].comments;
        }
        // populate_with_comments();
        populate_images_with_maps();

    });


}

function populate_with_comments(src) {

    var div_comm = document.getElementById(constants.popoverID).shadowRoot.getElementById('comments_id');
    var ok = 0;
    var template = '';


    for (var option in hist.globalShapes[src]) {
        ok = 0;
        template += `<div id="${option}" class="casuta-comment">`;
        if (hist.globalComments[src] && hist.globalComments[src][option]) {
            for (var comment in hist.globalComments[src][option]) {

                ok = 1;
                template += `<p class="user-name"><b>${hist.globalComments[src][option][comment].email}</b> says:</p>
                <br/>
                <br/>
                <p class="comment-text">${hist.globalComments[src][option][comment].comment}</p>
                <p class="data-postare-comment">Date: ${hist.globalComments[src][option][comment].data} </p>
                <br/>
                <br/>
                <br/>`

            }
        }
        if (!ok) {
            template += "No comment";

        }
        template += `</div>`;

    }

    div_comm.innerHTML = template;
    var select_comm = document.getElementById(constants.popoverID).shadowRoot.getElementById('select_comments');


    select_comm.innerHTML = "<option value=\"default\">All</option>";

    for (var option in hist.globalShapes[src]) {
        select_comm.innerHTML += `<option value="${option}">Shape ${option}</option>`;
    }
    select_comm.addEventListener("change", function (e) {
        var options = document.getElementById(constants.popoverID).shadowRoot.querySelectorAll('.casuta-comment');
        var target = document.getElementById(constants.popoverID).shadowRoot.getElementById(e.target.value);
        for (i = 0; i < options.length; i++) {
            options[i].classList.remove("shown");
        }
        if (e.target.value === "default") {
            for (i = 0; i < options.length; i++) {
                options[i].classList.add("shown");
            }
        }
        else {

            options[e.target.value].classList.add("shown");
        }
        var canvas = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.canvas_id2);
        var context = canvas.getContext('2d');
        canvas.width = hist.image.width;
        canvas.height = hist.image.height;
        hist.clear(canvas, context);

        context.lineWidth = 5;
        context.strokeStyle = '#10bd04';
        for (var i = 0; i < hist.globalShapes[hist.image.src][select_comm.value].length - 2; i += 2) {

            context.beginPath();
            context.moveTo(hist.globalShapes[hist.image.src][select_comm.value][i], hist.globalShapes[hist.image.src][select_comm.value][i + 1]);
            context.lineTo(hist.globalShapes[hist.image.src][select_comm.value][i + 2], hist.globalShapes[hist.image.src][select_comm.value][i + 3]);
            context.stroke();
        }
        context.beginPath();
        context.moveTo(hist.globalShapes[hist.image.src][select_comm.value][i], hist.globalShapes[hist.image.src][select_comm.value][i + 1]);
        context.lineTo(hist.globalShapes[hist.image.src][select_comm.value][0], hist.globalShapes[hist.image.src][select_comm.value][1]);
        context.stroke();
        document.getElementById(constants.popoverID).shadowRoot.getElementById("canvas_warning").style.display = "none";
    });


}

function get_metadata_img(img, popover) {
    var info_img = document.getElementById(constants.popoverID).shadowRoot.getElementById('infos');
    var template = `<ul><li>Height:${img.height}px</li>
                    <li>Width:${img.width}px</li>
                    <li>Position in page: x:${getPositionofTargetImage(img).x} y:${getPositionofTargetImage(img).y}</li>`;
    if (img.id) {
        template += ` <li>Id:${img.id}</li>`;
    }
    if (img.alt) {
        template += ` <li>Description:${img.alt}</li>`;
    }
    template += "</ul>";
    info_img.innerHTML = template;

    info_img = document.getElementById(constants.popoverID).shadowRoot.getElementById('data');
    var nr = 0;
    if (hist.currentShapes[img.src]) {

        for (var el in hist.currentShapes[img.src]) {
            nr += 1
        }
    }
    if (hist.globalShapes[img.src]) {
        for (var el in hist.globalShapes[img.src]) {
            nr += 1
        }
    }

    template = `<ul>
                <li>
                    ${nr}
                    <span>Shapes</span>
                </li>
                <li>
                    ${0}
                    <span>Comments</span>
                </li>

            </ul>`;
    info_img.innerHTML = template;
}

function populate_images_with_maps() {
    if (hist.currentUser) {
        for (let img in hist.currentShapes) {

            let currentImage = document.querySelector(`img[src='${img}']`);
            currentImage.style.filter = hist.css[img];
            currentImage.useMap = '#' + img;

            let innerhtml = `<map name="${img}">`;

            for (let shape in hist.currentShapes[img]) {
                innerhtml += `<area  shape="poly" class="test" coords="${hist.currentShapes[img][shape]}"  href="${hist.current_urls[img][shape].clicker}">`;

            }
//if he wants
            if (add_globals) {
                for (let shape in hist.globalShapes[img]) {
                    innerhtml += `<area  shape="poly" class="test1" coords="${hist.globalShapes[img][shape]}"  href="${hist.global_urls[img][shape].clicker}">`;

                }
            }
            innerhtml += "</map>";


            currentImage.innerHTML += innerhtml;
            let areas = document.querySelectorAll(`img[src='${img}']  area[class='test']`);
            areas.forEach(function (area, index) {

                var img2 = document.querySelector(`img[src='${img}']`);
                var pre_url;
                area.addEventListener("mouseover", function (event) {

                    pre_url = img2.src;
                    img2.src = hist.current_urls[img][index].hover;
                    document.addEventListener("keypress", function (e) {
                        keyaction(e, event)
                    });

                })
                area.addEventListener("mouseout", function () {
                    img2.src = pre_url;
                    document.removeEventListener("keypress", keyaction, false);
                })
            });
            areas = document.querySelectorAll(`img[src='${img}']  area[class='test1']`);
            areas.forEach(function (area, index) {

                var img2 = document.querySelector(`img[src='${img}']`);
                var pre_url;
                area.addEventListener("mouseover", function (event) {
                    var template_tags = "<ul>";
                    for (var comment in hist.globalComments[img][index]) {
                        template_tags += `<li>
                        @${hist.globalComments[img][index][comment].email} <div style="color:black"> ${hist.globalComments[img][index][comment].comment}</div>
                    </li>`;
                    }
                    template_tags += "</ul>";
                    document.getElementById(constants.popoverID).shadowRoot.getElementById("tags").innerHTML = template_tags;
                    pre_url = img2.src;
                    img2.src = hist.global_urls[img][index].hover;
                    document.addEventListener("keypress", function (e) {
                        keyaction(e, event)
                    });

                });
                area.addEventListener("mouseout", function () {
                    img2.src = pre_url;
                    document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.popover_comments).style.display = "none";
                    document.removeEventListener("keypress", keyaction, false);
                })
            })
        }
    } else {
        for (let img in hist.globalShapes) {
            let currentImage = document.querySelector(`img[src='${img}']`);
            currentImage.useMap = '#' + img;

            let innerhtml = `<map name="${img}">`;

            for (let shape in hist.globalShapes[img]) {
                innerhtml += `<area  shape="poly" class="test" coords="${hist.globalShapes[img][shape]}"  href="${hist.global_urls[img][shape].clicker}">`;
            }
            innerhtml += "</map>";

            currentImage.innerHTML += innerhtml;
            let areas = document.querySelectorAll(`img[src='${img}']  area[class='test']`);

            areas.forEach(function (area, index) {

                var img2 = document.querySelector(`img[src='${img}']`);
                var pre_url;
                area.addEventListener("mouseover", function (event) {
                    var template_tags = "<ul>";
                    for (var comment in hist.globalComments[img][index]) {
                        template_tags += `<li>
                        @${hist.globalComments[img][index][comment].email} <div style="color:black"> ${hist.globalComments[img][index][comment].comment}</div>
                    </li>`;
                    }
                    template_tags += "</ul>";
                    document.getElementById(constants.popoverID).shadowRoot.getElementById("tags").innerHTML = template_tags;
                    pre_url = img2.src;
                    img2.src = hist.global_urls[img][index].hover;
                    document.addEventListener("keypress", function (e) {
                        keyaction(e, event)
                    });

                })
                area.addEventListener("mouseout", function () {
                    img2.src = pre_url;
                    document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.popover_comments).style.display = "none";
                    document.removeEventListener("keypress", keyaction, false);
                })
            })
        }


    }
}

function keyaction(e, event) {
    if (e.keyCode == 67 && e.shiftKey) {
        positionPopupOnPage(event, document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.popover_comments))

    }


}

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(2, request, sender)
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        if (request.popover) {
            if (request.sign === true) {
                remove_listener = true;
            } else {
                remove_listener = false;
            }
            if (request.global === true) {
                add_globals = true;
            } else {
                add_globals = false;

            }
            get_info_from_background();
        }
        else {
            changes_to_modal(request);

            get_info_from_background();
        }
// window.location.reload(true)


    })
;

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

        get_input_urls_value(select.value);

        document.getElementById(constants.popoverID).shadowRoot.getElementById("canvas_warning").style.display = "none";
    });

}

function get_input_urls_value(selectedValue, add) {
    var input_click = document.getElementById(constants.popoverID).shadowRoot.getElementById("click_url");
    var input_hover = document.getElementById(constants.popoverID).shadowRoot.getElementById("img_url");

    if (modifications.urls == null || modifications.urls == undefined) {
        modifications.urls = {};
    }
    if (add == 1 && selectedValue == "default") {//warning daca empty string
        hist.shapes_added = 0;
        if (hist.current_urls[hist.image.src] == undefined) {
            hist.current_urls[hist.image.src] = {}
        }
        for (var elem in hist.current_urls[hist.image.src]) {
            hist.shapes_added += 1;
        }

        selectedValue = hist.shapes_added;

        modifications.urls[selectedValue] = {clicker: input_click.value, hover: input_hover.value};
        hist.shapes_added += 1;
        input_click.value = "";
        input_hover.value = "";

    }
    else {

        if (selectedValue == "default") {
            input_click.value = "";
            input_hover.value = "";

        }
        else {

            if (add == 1) {
                modifications.urls[selectedValue] = {
                    clicker: input_click.value,
                    hover: input_hover.value
                };

                input_click.value = "";
                input_hover.value = "";
                hist.shapes_added = 1;
            } else {
                input_click.value = hist.current_urls[hist.image.src][selectedValue].clicker;
                input_hover.value = hist.current_urls[hist.image.src][selectedValue].hover;
            }

        }
    }

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
    add_listener_for_submit_button();
    modal.addEventListener("click", function () {
        popover.style.display = "none"
    });

    small_box.addEventListener("click", function (event) {

        positionPopupOnPage(event, popover);

    })


}

function add_listener_for_submit_button() {
    document.getElementById(constants.popoverID).shadowRoot.getElementById("input_id").addEventListener("click", function (e) {
            if (hist.currentUser) {
                var text_area = document.getElementById(constants.popoverID).shadowRoot.getElementById("textarea_id");
                var select = document.getElementById(constants.popoverID).shadowRoot.getElementById("select_comments");
                var current_option = select.options[select.selectedIndex].value;

                var data=new Date()
                if (current_option != "default") {
                    if (hist.globalComments[hist.image.src]) {
                        if (hist.globalComments[hist.image.src][current_option]) {
                            hist.globalComments[hist.image.src][current_option].push({
                                comment: text_area.value,
                                email: hist.currentUser.email,
                                data: data.toDateString()
                            })
                        }else{
                            hist.globalComments[hist.image.src][current_option] = [];
                            hist.globalComments[hist.image.src][current_option].push({
                                comment: text_area.value,
                                email: hist.currentUser.email,
                                data: data.toDateString()
                            });
                        }

                    } else {
                        hist.globalComments[hist.image.src] = {};
                        hist.globalComments[hist.image.src][current_option] = [];
                        hist.globalComments[hist.image.src][current_option].push({
                            comment: text_area.value,
                            email: hist.currentUser.email,
                            data: data.toString()
                        });

                    }
                } else {
                    var nr = 0;


                }
                populate_with_comments(hist.image.src)
            }
        }
    )
}

window.onload = function () {
    var current_popover, small_box, modal, popover, comment_popover;
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
            //change_comments();
            get_info_from_background();

            popover = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.popoverID2);
            comment_popover = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.popover_comments);
            small_box = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.small_box);
            modal = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.modal_button);
            //listeners
            add_listeners(modal, popover, small_box);

            window.addEventListener("mouseover", function main_listener(event) {
                if (remove_listener) {
                    // this.removeEventListener('mouseover', arguments.callee);
                } else {
                    if (event.target.tagName === "IMG" && event.target.id != constants.popoverID) {

                        var target_positions = getPositionofTargetImage(event.target);
                        small_box.style.top = target_positions.y + "px";
                        small_box.style.left = target_positions.x + "px";
                        small_box.style.display = "block";

                        get_metadata_img(event.target, popover);
                        add_hovered_img(event.target.src);

                        properties_whatever();
                        add_shapes_img(event.target.src);
                        populate_with_comments(event.target.src);
                        current_popover = popover;

                    } else {

                        if (small_box != undefined && event.target.id != constants.popoverID && event.target.id != constants.popover_comments) {
                            small_box.style.display = "none";
                        }
                        if (current_popover != undefined && event.target.id !== constants.popoverID && event.target.id != constants.popover_comments) {//null
                            comment_popover.style.display = "none";
                            current_popover.style.display = "none";
                            current_popover = null;
                        }
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
                comment_popover.style.display = "none";
                if (current_popover !== undefined && current_popover.style != null) {

                    popover.style.display = "none";
                }

            });
            window.addEventListener("resize", function (e) {
                if (current_popover !== undefined) {
                    comment_popover.style.display = "none";
                    small_box.style.display = "none";
                    popover.style.display = "none"
                }
            });
        })


    });


}
