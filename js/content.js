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
        inject.innerHTML = data;
        document.body.insertBefore(inject, document.body.firstChild);

        window.addEventListener("mouseover", function (event) {
            if (event.target.tagName === "IMG" && !findAncestor(event.target, constants.popoverMainClass)) {
                var popover = document.getElementById(constants.popoverID);
                popover.style.top = event.target.offsetTop.toString() + "px";
                popover.style.left = event.target.offsetLeft.toString() + "px";
                popover.style.display = "block";//add a class not display


                if (current_popover === undefined) {
                    var modal = document.getElementById(constants.modal_button);
                    modal.addEventListener("click", function () {
                        console.log('done')
                    })
                }
                current_popover = popover;

            } else {

                if (current_popover != undefined && findAncestor(event.target, constants.popoverMainClass) !== current_popover) {//null
                    current_popover.style.display = "none";
                    current_popover = null;
                }
            }
        });
    });


}
