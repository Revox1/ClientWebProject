var config = {
    apiKey: "AIzaSyBrFE6E4b5h5D8kT8djrVK5qM2Xfn3kBkI",
    authDomain: "cliw-8ef3d.firebaseapp.com",
    databaseURL: "https://cliw-8ef3d.firebaseio.com",
    projectId: "cliw-8ef3d",
    storageBucket: "cliw-8ef3d.appspot.com",
    messagingSenderId: "554773172307"
};
firebase.initializeApp(config);

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(request,sender)
        console.log(sender.tab ?
            "from a content script:" + sender.tab.url :
            "from the extension");
        console.log(firebase.auth().user)
        if (request.greeting == "hello")
            sendResponse({farewell: "goodbye"});

    });



function initApp() {
    // Listen for auth state changes.
    firebase.auth().onAuthStateChanged(function (user) {

        console.log('User state change detected from the Background script of the Chrome Extension:', user);
        if (user) {
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {greeting: "hello"}, function(response) {});});
        }
    });

}

window.onload = function () {
    initApp();
};