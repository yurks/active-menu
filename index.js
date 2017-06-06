/**
 * Menu Node Class Requirement
 *
 * @type {ActiveMenuNode}
 */
var ActiveMenuNode = require('./active-menu-node');

var url = require('url');

/**
 * Menu Instance Reference For This Menu (that = this)
 * @type {module}
 */
var menuInstances = {};

/**
 * Main Menu Class
 *
 * @param menuName
 * @constructor
 */
var ActiveMenu = module.exports = function(menuName, classNameSanitizer) {

    // Assign Instance Reference
    menuInstances[menuName] = this;

    // Menu Name
    this.menuName = menuName;

    this.classNameSanitizer = classNameSanitizer;

    /**
     * List of Child Nodes
     * @type {ActiveMenuNode[]}
     */
    this.nodeList = [];

    /**
     * HTML Attributes Array
     * @type {Array}
     */
    this.htmlAttributes = [];

    /**
     * Active Route
     * @type {String}
     */
    this.activeRoute = '';

    /**
     * Depth
     * @type {int}
     */
    this.depth = -1;

    /**
     * HTML Sourcery Generator
     */
    this.generator = require('html-sourcery');
};


/**
 * Middleware Function
 * @param req
 * @param res
 * @param next
 */
ActiveMenu.menu = function(req, res, next) {
    var route = req.route || req.url;
    route = typeof route === 'string' ? url.parse(route) : route;
    route = route && route.path || '';
    for(var menuName in menuInstances) {
        // Assign Request
        menuInstances[menuName].activeRoute = route;
    }
    // Assign To Local
    res.locals.menu = menuInstances;
    // Next
    next();
};

/**
 * Set HTML Attributes
 *
 * @param attributes
 * @returns {exports}
 */
ActiveMenu.prototype.setAttributes = function(attributes) {
    this.htmlAttributes = attributes;
    return this;
};

/**
 * Set Microdata ItemType
 *
 * @param type
 * @returns {exports}
 */
ActiveMenu.prototype.setMicroData = function(type) {
    this.htmlAttributes.itemscope = '';
    this.htmlAttributes.itemtype = type;
    this.isMicroData = true;
    return this;
};

/**
 * Add a New Menu Node
 *
 * @param text
 * @param route
 * @returns {ActiveMenuNode}
 */
ActiveMenu.prototype.addMenuNode = function(text, route) {
    // New Node
    var newNode = new ActiveMenuNode(this, this);
    // Assign Variables
    newNode.text = text;
    newNode.route = route;
    newNode.elementType = 'li';
    // Add to List
    this.nodeList.push(newNode);
    // Return
    return newNode;
};

/**
 * Render Menu to String
 * Can be called separately or with something like Jade by calling the menuname
 *
 * @returns {String}
 */
ActiveMenu.prototype.toString = function() {

    // Init Child Html
    var childHtml = [];

    // Node List for Reference Below
    var nodeList = this.nodeList;

    // Generate Children HTML Recursively
    this.nodeList.forEach(function(childNode, key) {
        // Handle First and Last
        if (key === 0) {
            childNode.isFirst = true;
        }
        if (key == (nodeList.length - 1)) {
            childNode.isLast = true;
        }
        // Append
        childHtml.push(childNode.toHtml(childHtml.length));
    });

    this.htmlAttributes.class = 'menu ' + (this.htmlAttributes.class || '');
    if (this.classNameSanitizer) {
        this.htmlAttributes.class += ' menu--' + this.classNameSanitizer(this.menuName);
    }
    // Wrap in Menu HTML, Compile and Return
    return this.generator.ul(
        this.htmlAttributes,
        childHtml.join('')
    ).compile();
};
