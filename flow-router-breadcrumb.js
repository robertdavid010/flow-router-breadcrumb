if (Meteor.isClient) {
}
var Breadcrumb = {};

var data = {}; // routes are registered here on initialization
var dataArray = []; // this is the data to render
var crumbArr = [];
var cakeDataArray = []; // this is the cake data to render
var inited = false; // flag for initialization

// Config
var levelConfig = {
    "listLevel": {
        depth: 1,
        order: 1,
        priority: 1
    },
    "detailsLevel": {
        depth: 2,
        order: 1,
        priority: 2
    },
    "inputLevel": {
        depth: 1,
        order: 1,
        priority: 3
    }
};

// Or...
Breadcrumb.Config = {
    homeRoute: "home",
    maxLevels: 4,
    levelConfig: levelConfig
};

// Initialize
Breadcrumb.initialize = function () {
    // Session.set("cakeCrumbs", {});
    console.log("we are initializing cakeCrumbs");
    // console.log(route);
    var r = FlowRouter.getRouteName();
    var homeRoute = Breadcrumb.Config.homeRoute;
    if (r != homeRoute) {
        // this is not home, so we add the first crumb...
        var routePath = data[homeRoute];
        cakeDataArray[0] = {homeLevel: [routePath]};
    }
    inited = true;
};

// Register
Breadcrumb.register = function (route) {

    route.options.breadcrumb.title = route.options.breadcrumb.title || 'No Title';

    data[route.name] = route;

    if (!inited) {
        Breadcrumb.initialize();
    }

};

Breadcrumb.generate = function (paramsAll) {
    // This will generate the cake crumbs
    // This disabled, always assumed name from router;
    // var routeName = routeName || FlowRouter.getRouteName();
    var routeName = FlowRouter.getRouteName();
    // Get the stored route info that was registered
    // this is where we hook into Session();
    // var cakeRoute = Session.get("cakeCrumbs");
    // console.log("are we getting cakeCrumbs?");
    // console.log(cakeRoute);
    // Gets the registered route data
    var getRouter = data[routeName];
    // console.log("paramsAll");
    // console.log(paramsAll);
    // console.log("looking at the router object:");
    // console.log(getRouter);
    var level = getRouter.options && getRouter.options.breadcrumb && getRouter.options.breadcrumb.level || null;
    var crumbs = cakeDataArray;

    var matched = -1;
    var numElem = 0;


    crumbs.forEach(function (e, i) {
        // this is not evaluating correctly
        // or is it now?
        console.log("looping for: " + level);
        console.log(e);
        console.log(e[level]);
        console.log("is array?: " + Array.isArray(e[level]))
        if (e[level] || Array.isArray(e[level])) {
            matched =  i;
        } else {
            // if (!matched) {
            //     matched = -1;
            // }
            // matched = !matched ? -1 : matched; // THIS IS OVERWRITING
        }
    });
    console.log("matched elements: ");
    console.log(matched);

    // var theElem = cakeDataArray.indexOf(getRouter.options.breadcrumb.level);
    console.log("the existing cakeCrumbs array");
    console.log(cakeDataArray);
    var arr = [];
    if (matched || matched > 0) {
        // these is an element
        console.log("there is an existing top level element");
        console.log(level);
        arr = cakeDataArray && cakeDataArray[matched] && cakeDataArray[matched][level] || []; // get array for this level
    }

    // Add the params
    for (var p in paramsAll) {
        getRouter[p] = paramsAll[p];
    }

    // Check this level array for this route
    console.log("arr");
    console.log(arr);
    console.log("router name: " + getRouter.name);
    var isInArray = -1;
    for (var i = arr.length - 1; i >= 0; i--) {
        var nm = arr[i];
        console.log("** checking name in arr");
        console.log(nm.name);
        if (nm.name === getRouter.name) {
            isInArray = i;
        }
    }
    console.log("isInArray");
    console.log(isInArray)
    // var isInArray = arr.indexOf({name: getRouter.name});
    if (isInArray < 0) {
        // there is no array element of this name
        console.log("this route was not in the level");
        console.log(getRouter.name)
        arr.push(getRouter);
    } else {
        // there is an element with this name
        // we want to spice first:
        arr.splice(isInArray, 1);
        console.log("this route WAS in the level");
        // arr[getRouter.name] = getRouter;
        arr.push(getRouter);
    }

    // TODO: this is where we can sort priority
    // var e;
    var updater = {};
    updater[getRouter.options.breadcrumb.level] = arr;
    if (matched === -1) {
        // Put this as a new element
        // Do a push intead
        // if (cakeDataArray.length > 0) {
            // e = cakeDataArray.length;
        // } else {
            // e = 1;
        // }
    } else {
        // we reserve [0] for home, so min is [1], with the matched elem
        // e = Math.max(matched, 1);
        // e = matched;
        if (matched != 0) {
            cakeDataArray.splice(matched, 1);
        }
    }

    // This lets us nest it in another array
    console.log("updating the tracker:");
    console.log(updater);
    cakeDataArray.push(updater);
    // cakeDataArray[e] = updater;

    // we can return false to break reactiveness?

}; // END Breadcrumb.generate()

Breadcrumb.render = function () {

    console.log("starting breadcrumb render");
    var url;
    var routeName = routeName || FlowRouter.getRouteName();
    // initialize crumb array
    crumbArr = [];
    // generate our better crumbs
    // this loops the level objects
    for (var i = 0; i < cakeDataArray.length; i++) {
        var ob = cakeDataArray[i];
        var elem = ob[Object.keys(ob)[0]];

        console.log("object lopper");
        console.log(cakeDataArray.length);
        // now loop the array in the nested object

        var routes = elem.forEach(function (el, ix, arr) {
            var obj = {};
            obj.url = FlowRouter.path(el.name, el.params, el.queryParams);
            obj.title = el.options.breadcrumb.title;
            if (routeName === el.name) {
                obj.activeClass = "active";
            } else {
                obj.activeClass = "";
            }
            // if (ix === arr.length -1 && i === cakeDataArray.length) {
            // } else {
            //     obj.activeClass = "";
            // }
            // console.log("Updater again:");
            // console.log(el);
            crumbArr.push(obj); // TODO: This causes the helper re-trigger
        });

    };

    return crumbArr;

};

// Render. NOTE: Currently never called with routeName
Breadcrumb.oldrender = function (routeName) {
    // This function gets the route data,
    // and recursively checks for parent data as defined
    // in the route definition

    dataArray = []; // Clear data array for the first time
    // cakeDataArray = []; // WE WANT THIS TO PERSIST

    // Always uses routeName
    var routeName = routeName || FlowRouter.getRouteName();

    // Gets the registered route data
    var getRouter = data[routeName];

    // Gen route url
    var paramAndQuery = genParamAndQuery(getRouter.options.breadcrumb);
    var url = FlowRouter.path(routeName, paramAndQuery.params, paramAndQuery.queryParams);

    // Push data
    dataArray.push({
        url: url,
        title: getRouter.options.breadcrumb.title,
        activeClass: 'active'
    });

    // Check parent
    if (getRouter.options.breadcrumb.parent) {
        getParent(getRouter.options.breadcrumb.parent)
    }

    return dataArray.reverse();
};

// Get parent router
var getParent = function (route) {
    var getRouter = data[route];

    // Gen route url
    var paramAndQuery = genParamAndQuery(getRouter.options.breadcrumb);
    var url = FlowRouter.path(route, paramAndQuery.params, paramAndQuery.queryParams);

    // Push data
    dataArray.push({
        url: url,
        title: getRouter.options.breadcrumb.title,
        activeClass: ''
    });

    // Check parent parent
    if (getRouter.options.breadcrumb.parent) {
        getParent(getRouter.options.breadcrumb.parent)
    }

    return false;
};

// Generate param and query
var genParamAndQuery = function (breadcrumb) {
    // Check is array
    breadcrumb.params = _.isArray(breadcrumb.params) ? breadcrumb.params : [breadcrumb.params];
    breadcrumb.queryParams = _.isArray(breadcrumb.queryParams) ? breadcrumb.queryParams : [breadcrumb.queryParams];

    var params = {};
    _.each(breadcrumb.params, function (o) {
        params[o] = FlowRouter.getParam(o);
    });
    var queryParams = {};
    _.each(breadcrumb.queryParams, function (o) {
        queryParams[o] = FlowRouter.getQueryParam(o);
    });

    return {params: params, queryParams: queryParams};
};

/**
 * Register to flow router
 */
 // NOTE: This runs once for every defined route, to 
 // propagate the data[] object above
FlowRouter.onRouteRegister(function (route) {
    if (route.options.breadcrumb) {
        Breadcrumb.register(route);
    }
});

if (Meteor.isClient) {
    Meteor.startup(function() {
        Tracker.autorun(function(c) {
          FlowRouter.watchPathChange();
          var paramsAll = FlowRouter.current();
          // console.log("changed the router");
          // console.log(FlowRouter.current());
          if (FlowRouter._initialized) {
            Breadcrumb.generate(paramsAll); // This just triggers the generate on route change...
          }
          // var currentContext = FlowRouter.current();
          // do anything with the current context
          // or anything you wish
        });
    });
}

/**
 * Global Template helper
 */
Template.registerHelper('breadcrumb', function () {
    return Breadcrumb.render();
});
