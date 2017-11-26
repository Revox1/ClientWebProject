function findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls)) ;
    return el;
}

function load_url_for_images(ids,urls) {
    var img;
    for(var i=0;i<ids.length;i++){
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

function setCssClass(event, className){
    var img;
    img=document.getElementById(constants.popoverID).shadowRoot.getElementById("modalImage");
    if(img.classList.contains(className)){
        img.classList.remove(className);
    }
    else{
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

//todo completely refactor this
function openCity(evt, cityName) {

    var i, tabcontent, tablinks;
    tabcontent = document.getElementById(constants.popoverID).shadowRoot.querySelectorAll(".tabcontent");
    for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].classList.remove("shown");
    }
    tablinks = document.getElementById(constants.popoverID).shadowRoot.querySelectorAll(".tablinks");
    for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
    }
    document.getElementById(constants.popoverID).shadowRoot.getElementById(cityName).classList.add("shown");
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


window.onload = function () {
    var current_popover;

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
            load_url_for_images(constants.popover_img_ids,constants.popover_img_urls);
            load_url_for_images(constants.imageChangePropModalID,constants.imageChangePropModal)
            // document.getElementById(constants.popoverID).shadowRoot.getElementById('canvas1').addEventListener('click', drawLine, false);
            window.addEventListener("mouseover", function (event) {
                if (event.target.tagName === "IMG" && event.target.id != constants.popoverID) {

                    var popover = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.popoverID2);
                    positionPopupOnPage(event, popover);

                    if (current_popover === undefined) {
                        var modal = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.modal_button);

                        modal.addEventListener("click", function () {
                            popover.style.display = "none"
                        })
                    }

                    current_popover = popover;

                } else {
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
                    openCity(event, t.innerHTML);
                });
            });
            properties.forEach(function(t){
                t.addEventListener("click",function (event) {
                    setCssClass(event, t.innerHTML)
                })
            })
            window.addEventListener("scroll", function (e) {
                if (current_popover != undefined) {
                    current_popover.style.display = "none"
                }

            });
            window.addEventListener("resize", function (e) {
                if (current_popover != undefined) {

                    current_popover.style.display = "none"
                }
            });
        })


    });


}
