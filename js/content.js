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

window.onload = function () {
    var current_popover;

    httpGetAsynca("html/extension_popover.html", function (data) {

        var inject = document.createElement("div");
        inject.id = constants.popoverID;
        // inject.innerHTML = data;
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
                    popover.style.top = event.target.offsetTop.toString() + "px";
                    popover.style.left = event.target.offsetLeft.toString() + "px";
                    popover.style.display = "block";//add a class not display

                    if (current_popover === undefined) {
                        var modal = document.getElementById(constants.popoverID).shadowRoot.getElementById(constants.modal_button);
                        modal.addEventListener("click", function () {
                            console.log('done')
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
        })




    });


}
