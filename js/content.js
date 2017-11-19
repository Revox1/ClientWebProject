function findAncestor(el, cls) {
    while ((el = el.parentElement) && !el.classList.contains(cls)) ;
    return el;
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

function positionPopupOnPage( event,popover ) {
    var scrollLeft = (window.pageXOffset !== undefined) ? window.pageXOffset : (document.documentElement || document.body.parentNode || document.body).scrollLeft;
    var scrollTop = (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body).scrollTop;
    var vpWH = [];
    var vpW, vpH;
    var intCoordX = event.clientX ;
    var intCoordY = event.clientY;
    var intXOffset = intCoordX;
    var intYOffset = intCoordY;

    vpWH = getViewPortWidthHeight();
    vpW = vpWH[0];
    vpH = vpWH[1];

    popover.style.display = 'block';
    if ( intCoordX > vpW/2 ) { intXOffset -= popover.offsetWidth; }
    if ( intCoordY > vpH/2 ) { intYOffset -= popover.offsetHeight; }


    popover.style.top = (intYOffset+scrollTop) + 'px';
    popover.style.left = (intXOffset+scrollLeft) + 'px';

}	// end fn positionPopupOnPage

function getViewPortWidthHeight() {

    var viewPortWidth;
    var viewPortHeight;

    if (typeof window.innerWidth !== undefined)
    {
        viewPortWidth = window.innerWidth;
        viewPortHeight = window.innerHeight;
    }

    // IE6 in standards compliant mode (i.e. with a valid doctype as the
    // first line in the document)
    else if (typeof document.documentElement !== undefined && typeof document.documentElement.clientWidth !== undefined && document.documentElement.clientWidth !==0)
    {
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
        httpGetAsynca("css/extension_popover.css",function (data2) {
            inject2.innerHTML=data2;
            shadow.appendChild(inject2);
            inject2 = document.createElement("div");
            inject2.innerHTML = data;
            shadow.appendChild(inject2);

            window.addEventListener("mouseover", function (event) {
                if (event.target.tagName === "IMG" && event.target.id!=constants.popoverID) {

                    var popover =  document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.popoverID2);
                    positionPopupOnPage(event,popover);

                    if (current_popover === undefined) {
                        var modal = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.modal_button);
                        modal.addEventListener("click", function () {
                            console.log('pornire modal')
                            popover.style.display="none"
                        })
                    }

                    current_popover = popover;

                } else {
                    if (current_popover != undefined && event.target.id!==constants.popoverID) {//null
                        current_popover.style.display = "none";
                        current_popover = null;
                    }
                }
            });
            window.addEventListener("scroll",function (e) {
                if(current_popover!=undefined){

                    current_popover.style.display="none"
                }

            });
            window.addEventListener("resize",function (e) {
                if(current_popover!=undefined){

                    current_popover.style.display="none"
                }
            });
        })




    });


}
