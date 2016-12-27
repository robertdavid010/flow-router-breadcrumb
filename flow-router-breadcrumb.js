/**
 * Breadcrumbs with cakecrumb feature added.
 *
 * Cakecrumbs can be better then breadcrumbs. They are
 * dynamically generated based on the navigation history
 * of the user.
 * Crumbs are names of routes grouped into levels defined
 * in the "breadcrumb" element of the route definition.
 * These crumbs and levels can then be assiged priority
 * and other properties in the new configuration options.
 *
 */
var Breadcrumb = {};

var data = {}; // routes are registered here on initialization
var dataArray = []; // this is the data to render for breadcrumbs
var crumbArr = []; // Temporarily holds the cake crumbs
var cakeDataArray = []; // this is the cake data to render for cakecrumbs
var inited = false; // flag for initialization

// Configs
var levelsConfig = {
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

Breadcrumb.Config = {
    homeRoute: "home",
    maxLevels: 4,
    levelsConfig: levelsConfig
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

    var routeName = FlowRouter.getRouteName();

    // Get the necessary necessary data
    var getRouter = data[routeName];
    var level = getRouter.options && getRouter.options.breadcrumb && getRouter.options.breadcrumb.level || null;
    var crumbs = cakeDataArray;

    // Add the passed route params
    for (var p in paramsAll) {
        getRouter[p] = paramsAll[p];
    }

    // Initialize matched value
    var matched = -1;

    // Check array for matching nested object
    crumbs.forEach(function (e, i) {
        if (e[level] || Array.isArray(e[level])) {
            matched =  i;
        }
    });

    var arr = [];
    if (matched || matched > 0) {
        arr = cakeDataArray && cakeDataArray[matched] && cakeDataArray[matched][level] || []; // get array for this level
    }

    var isInArray = -1;
    for (var i = arr.length - 1; i >= 0; i--) {
        var nm = arr[i];
        if (nm.name === getRouter.name) {
            isInArray = i;
        }
    }

    if (isInArray >= 0) {
        arr.splice(isInArray, 1);
    }

    arr.push(getRouter);

    // TODO: this is where we can sort priority
    var updater = {};
    updater[getRouter.options.breadcrumb.level] = arr;
    var homeRoute = Breadcrumb.Config.homeRoute;
    if (getRouter.name === homeRoute) {
        // This should only ever be 0
        cakeDataArray[matched] = updater;
    } else {
        // This blocks the homeLevel from changing
        if (matched > 0) {
            cakeDataArray.splice(matched, 1);
        }
        cakeDataArray.push(updater);
    }

    return false;

}; // END Breadcrumb.generate()

// Dynamically generate and update crumb data
Breadcrumb.renderCake = function () {

    crumbArr = []; // Clear data array
    var routeName = routeName || FlowRouter.getRouteName();

    // Loop through the level objects
    for (var i = 0; i < cakeDataArray.length; i++) {
        var ob = cakeDataArray[i];
        var elem = ob[Object.keys(ob)[0]];

        // console.log("object lopper"); // Will show reactive retriggers
        // console.log(cakeDataArray.length);

        // Loop in the array of nested object
        var routes = elem.forEach(function (el, ix, arr) {
            var obj = {};
            obj.url = FlowRouter.path(el.name, el.params, el.queryParams);
            obj.title = el.options.breadcrumb.title;
            if (routeName === el.name) {
                obj.activeClass = "active";
            } else {
                obj.activeClass = "";
            }
            crumbArr.push(obj); // TODO: This causes the helper re-trigger
        });

    };

    return crumbArr;

};

// Recursively generate static crumb data
Breadcrumb.renderBread = function (routeName) {

    dataArray = []; // Clear data array for the first time

    var routeName = routeName || FlowRouter.getRouteName();

    // Get the registered route data
    var getRouter = data[routeName];

    // Generate route url
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

    // Generate route url
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
FlowRouter.onRouteRegister(function (route) {
    if (route.options.breadcrumb) {
        Breadcrumb.register(route);
    }
});

/**
 * Track route changes
 */
if (Meteor.isClient) {
    Meteor.startup(function() {
        Tracker.autorun(function(c) {
          FlowRouter.watchPathChange();
          if (FlowRouter._initialized) {
            // Trigger the dynamic crumb generation on route change...
            var paramsAll = FlowRouter.current();
            Breadcrumb.generate(paramsAll);
          }
        });
    });
}

/**
 * Global Template helpers
 */
Template.registerHelper('breadcrumb', function () {
    return Breadcrumb.renderBread();
});

Template.registerHelper('cakecrumb', function () {
    return Breadcrumb.renderCake();
});
