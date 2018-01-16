var config = {
    apiKey: "AIzaSyBrFE6E4b5h5D8kT8djrVK5qM2Xfn3kBkI",
    authDomain: "cliw-8ef3d.firebaseapp.com",
    databaseURL: "https://cliw-8ef3d.firebaseio.com",
    projectId: "cliw-8ef3d",
    storageBucket: "cliw-8ef3d.appspot.com",
    messagingSenderId: "554773172307"
};
var popup_info = {
    global: false,
    sign: true
};
firebase.initializeApp(config);

chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        console.log(sender, request);
        if (request.get_pop_info) {
            sendResponse({global: popup_info.global, sign: popup_info.sign});
        } else {
            if (request.popover) {
                if (request.global) {
                    popup_info.global = request.global;
                }
                if (request.sign) {
                    popup_info.sign = request.sign;
                }
                chrome.tabs.query({}, function (tabs) {
                    for (var i = 0; i < tabs.length; ++i) {
                        chrome.tabs.sendMessage(tabs[i].id, {
                            popover: true,
                            sign: popup_info.sign,
                            global: popup_info.global
                        }, function (response) {
                        });
                    }
                });
            } else {
                if (request.task === "save_global") {
                    updateGlobalData(request, sender.tab.url)
                } else {
                    if (firebase.auth().currentUser) {
                        firebase.database().ref('/users/' + firebase.auth().currentUser.uid).once('value').then(function (snapshot) {
                            if (snapshot.val() == null) {
                                writeUserData(firebase.auth().currentUser.email)
                            }
                        });
                    }else{
                        firebase.database().ref('/users/' + 'global').once('value').then(function (snapshot) {
                            if (snapshot.val() == null) {
                                writeGlobalData('none')
                            }
                        });
                    }
                    if (request.task === "save_comments") {
                        updateGlobalComments(firebase.auth().currentUser.email, request, sender.tab.url)
                    }
                    if (request.task === "save_css") {
                        // console.log(request,sender)
                        updateUserCss(firebase.auth().currentUser.email, request, sender.tab.url)
                    }
                    if (request.task === "save") {
                        // console.log(request,sender)
                        updateUserData(firebase.auth().currentUser.email, request, sender.tab.url)
                    }
                    if (request.task === "get") {
                        var starCountRef = firebase.database().ref('users');
                        console.log(starCountRef)
                        var currentSite = {};
                        var globalSite = {};

                        starCountRef.on('value', function (snapshot) {
                            var snap = snapshot.val();

                            if (firebase.auth().currentUser) {
                                for (var counter_img in snap[firebase.auth().currentUser.uid].site) {

                                    if (snap[firebase.auth().currentUser.uid].site[counter_img].url == sender.tab.url) {
                                        currentSite[snap[firebase.auth().currentUser.uid].site[counter_img].img] = snap[firebase.auth().currentUser.uid].site[counter_img];
                                    }
                                }
                            }

                            for (var counter_img in snap["global"].site) {

                                if (snap["global"].site[counter_img].url == sender.tab.url) {
                                    globalSite[snap["global"].site[counter_img].img] = snap["global"].site[counter_img];
                                }
                            }
                        });
                        var user;
                        if(firebase.auth().currentUser){
                            user=firebase.auth().currentUser;
                        }

                        sendResponse({info: user, imgs: currentSite, global: globalSite});
                    }
                }
            }
        }
    });

function updateGlobalComments(email, request, site) {
    console.log("com", request)
    var starCountRef = firebase.database().ref('users/global');
    var updates = {};
    starCountRef.on('value', function (snapshot) {

        var snap = snapshot.val();
        if (snap.site == undefined) {
            snap.site = [];
        }
        updates = snap;
        for (var img in snap.site) {
            if (snap.site[img].url === site && snap.site[img].img === request.src) {
                updates.site[img].comments = request.comments;

            }
        }

    });

    firebase.database().ref('users/global').update(updates);
}
function writeUserData(email) {
    firebase.database().ref('users/' + firebase.auth().currentUser.uid).set({
        site: [], //  site: [{url: null, img: null, shapes: []}],
        email: email
    });
}
function writeGlobalData(email) {
    firebase.database().ref('users/' + 'global').set({
        site: [], //  site: [{url: null, img: null, shapes: []}],
        email: email
    });
}

function updateGlobalData(request, site) {
    var starCountRef = firebase.database().ref('users/global');
    var updates = {};
    starCountRef.on('value', function (snapshot) {

        var snap = snapshot.val();
        if (snap.site == undefined) {
            snap.site = [];
        }
        let ok = 0;
        updates = snap;
        for (var img in snap.site) {
            if (snap.site[img].url === site && snap.site[img].img === request.src) {
                updates.site[img].shapes = request.polygons;
                updates.site[img].urls = request.urls;
                ok = 1;
            }
        }
        if (!ok) {
            updates.site.push({img: request.src, url: site, shapes: request.polygons, urls: request.urls})
        }
    });

    firebase.database().ref('users/global').update(updates);
}

function updateUserData(email, request, site) {
    var starCountRef = firebase.database().ref('users/' + firebase.auth().currentUser.uid);
    var updates = {};
    starCountRef.on('value', function (snapshot) {

        var snap = snapshot.val();
        if (snap.site == undefined) {
            snap.site = [];
        }
        let ok = 0;
        updates = snap;
        for (var img in snap.site) {
            if (snap.site[img].url === site && snap.site[img].img === request.src) {
                updates.site[img].shapes = request.polygons;
                updates.site[img].urls = request.urls;
                ok = 1;
            }
        }
        if (!ok) {
            updates.site.push({img: request.src, url: site, shapes: request.polygons, urls: request.urls})
        }
    });

    firebase.database().ref('users/' + firebase.auth().currentUser.uid).update(updates);
}

function initApp() {
    // Listen for auth state changes.
    firebase.auth().onAuthStateChanged(function (user) {

        console.log('User state change detected from the Background script of the Chrome Extension:', user);
        chrome.tabs.query({}, function (tabs) {
            for (var i = 0; i < tabs.length; ++i) {
                chrome.tabs.sendMessage(tabs[i].id, {info: user}, function (response) {
                });
            }
        });
        /*  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, {info: user}, function(response) {});});
*/
    });

}

window.onload = function () {
    initApp();
};
function updateUserCss(email, request, site) {
    var starCountRef = firebase.database().ref('users/' + firebase.auth().currentUser.uid);
    var updates = {};
    starCountRef.on('value', function (snapshot) {

        var snap = snapshot.val();
        if (snap.site == undefined) {
            snap.site = [];
        }
        let ok = 0;
        updates = snap;
        for (var img in snap.site) {
            if (snap.site[img].url === site && snap.site[img].img === request.src) {
                updates.site[img].css = request.css;
                ok = 1;
            }
        }
        if (!ok) {
            updates.site.push({css:request.css})
        }
    });

    firebase.database().ref('users/' + firebase.auth().currentUser.uid).update(updates);
}