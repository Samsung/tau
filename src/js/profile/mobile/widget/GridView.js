/*global define, ns */
/*
 * Copyright (c) 2015 Samsung Electronics Co., Ltd
 *
 * Licensed under the Flora License, Version 1.1 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://floralicense.org/license/
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/*jslint nomen: true */
/**
 * # Grid View
 * Grid View components provides a list of grid-type and presents contents that are easily identified as images.
 *
 * ##Default Selectors
 * By default, all ul elements with the class="ui-gridview" or data-role="gridview" attribute are displayed as grid view components.
 *
 * ##Manual constructor
 *
 *      @example
 *      <ul id="gridview" class="ui-gridview">
 *          <li class="ui-gridview-item">
 *              <img class="ui-gridview-image" src="images/1.jpg">
 *              <div class="ui-gridview-handler"></div>
 *          </li>
 *          <li class="ui-gridview-item">
 *              <img class="ui-gridview-image" src="images/2.jpg">
 *              <div class="ui-gridview-handler"></div>
 *          </li>
 *          <li class="ui-gridview-item">
 *              <img class="ui-gridview-image" src="images/3.jpg">
 *              <div class="ui-gridview-handler"></div>
 *          </li>
 *          <li class="ui-gridview-item">
 *              <img class="ui-gridview-image" src="images/4.jpg">
 *              <div class="ui-gridview-handler"></div>
 *          </li>
 *      </ul>
 *      <script>
 *          var elGridView = document.getElementById("gridview"),
 *               gridView = tau.widget.GridView(elGridView);
 *      </script>
 *
 * @since 2.4
 * @class ns.widget.mobile.GridView
 * @component-selector .ui-gridview, [data-role]="gridview"
 * @extends ns.widget.BaseWidget
 */
(function (document, ns) {
	"use strict";
	//>>excludeStart("tauBuildExclude", pragmas.tauBuildExclude);
	define(
		[
			"../../../core/widget/BaseWidget",
			"../../../core/widget/core/Page",
			"../../../core/widget/core/Appbar",
			"./Popup",
			"../../../core/engine",
			"../../../core/event",
			"../../../core/event/gesture/Pinch",
			"../../../core/event/gesture/Instance",
			"../../../core/util/DOM",
			"../../../core/util/selectors",
			"../../../core/util/image",
			"../../../core/widget/BaseKeyboardSupport",
			"../widget"
		],
		function () {
			//>>excludeEnd("tauBuildExclude");
			var BaseWidget = ns.widget.BaseWidget,
				BaseKeyboardSupport = ns.widget.core.BaseKeyboardSupport,
				engine = ns.engine,
				utilsEvents = ns.event,
				utilsSelectors = ns.util.selectors,
				checkTransparency = ns.util.image.checkTransparency,
				utilsDom = ns.util.DOM,
				pageEvents = ns.widget.core.Page.events,
				Popup = ns.widget.mobile.Popup,
				PopupConstructor = ns.widget.Popup,
				popupSelector = Popup.selector,
				popupEvents = Popup.events,
				STYLE_PATTERN = ".ui-gridview li:nth-child({index})",
				MATRIX_REGEXP = /matrix\((.*), (.*), (.*), (.*), (.*), (.*)\)/,
				DATA_ROLE = "data-role",
				RESIZE_TIMEOUT = 300,
				BORDER_SIZE = 16,
				direction = {
					PREV: 0,
					NEXT: 1
				},
				labels = {
					IN: "in",
					OUT: "out",
					NONE: "none"
				},
				classes = {
					/**
					 * Standard gridview widget
					 * @style ui-gridview
					 * @member ns.widget.mobile.GridView
					 */
					GRIDLIST: "ui-gridview",
					/**
					 * Set element as item of gridview items list
					 * @style ui-gridview-item
					 * @member ns.widget.mobile.GridView
					 */
					ITEM: "ui-gridview-item",
					/**
					 * Set item of gridview as active
					 * @style ui-gridview-item-active
					 * @member ns.widget.mobile.GridView
					 */
					ITEM_ACTIVE: "ui-gridview-item-active",
					/**
					 * Set helper for gridview items list
					 * @style ui-gridview-helper
					 * @member ns.widget.mobile.GridView
					 */
					HELPER: "ui-gridview-helper",
					/**
					 * Create holder element to help reordering
					 * @style ui-gridview-holder
					 * @member ns.widget.mobile.GridView
					 */
					HOLDER: "ui-gridview-holder",
					/**
					 * Set element as image of gridview items list
					 * @style ui-gridview-image
					 * @member ns.widget.mobile.GridView
					 */
					IMAGE: "ui-gridview-image",
					/**
					 * Set label-type as label in gridview
					 * @style ui-gridview-label
					 * @member ns.widget.mobile.GridView
					 */
					LABEL: "ui-gridview-label",
					/**
					 * Set label-type as label-in in gridview
					 * @style ui-gridview-label-in
					 * @member ns.widget.mobile.GridView
					 */
					LABEL_IN: "ui-gridview-label-in",
					/**
					 * Set label-type as label-out in gridview
					 * @style ui-gridview-label-out
					 * @member ns.widget.mobile.GridView
					 */
					LABEL_OUT: "ui-gridview-label-out",
					/**
					 * Set handler for gridview items list
					 * @style ui-gridview-handler
					 * @member ns.widget.mobile.GridView
					 */
					HANDLER: "ui-gridview-handler",
					/**
					 * Set image as checked
					 * @style ui-gridview-image-checked
					 * @member ns.widget.mobile.GridView
					 */
					CHECKED: "ui-gridview-image-checked",
					/**
					 * Class indicates that gridview item has label
					 * @style ui-gridview-item-has-label
					 * @member ns.widget.mobile.GridView
					 */
					ITEM_HAS_LABEL: "ui-gridview-item-has-label",
					ITEM_HAS_ICON: "ui-gridview-image-icon"
				},
				selectors = {
					ANY_NOT_IMAGE: "*:not(." + classes.IMAGE + ")"
				},
				GridView = function () {
					var self = this;

					BaseKeyboardSupport.call(this);

					self.options = {};
					self._direction = 0;
					self._styleElement = null;
					self._inPopup = null;
					self._ui = {
						listElements: [],
						listItems: [],
						helper: {},
						holder: {},
						scrollableParent: null,
						content: null
					};
					self._borderSize = BORDER_SIZE;
					self._refreshSizesCallback = refreshSizes.bind(null, this);
				},
				prototype = new BaseWidget();

			GridView.prototype = prototype;
			GridView.classes = classes;

			function getScrollableParent(element) {
				var overflow;

				while (element !== document.body) {
					overflow = utilsDom.getCSSProperty(element, "overflow-y");
					if (overflow === "scroll" || (overflow === "auto" && element.scrollHeight > element.clientHeight)) {
						return element;
					}
					element = element.parentNode;
				}

				return null;
			}

			function refreshSizes(gridViewInstance) {
				gridViewInstance._setItemSize();
				gridViewInstance._checkItemLabel();
				gridViewInstance._setGridStyle();
				gridViewInstance._refreshItemsInfo();
				gridViewInstance._calculateListHeight();
				gridViewInstance._inPopup.refresh();
			}

			/**
			 * Configure options for GridView
			 * @method _configure
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._configure = function () {
				/**
				 * Options for widget.
				 * @property {Object} options
				 * @property {number} [options.cols=4] the number of columns to be displayed (for landscape 7 mobile)
				 * @property {boolean} [options.reorder=false] represents whether grid view is reorder mode
				 * @property {string} [options.label="none"] type of label to be attached to grid item("none", "in", "out")
				 * @property {number} [options.minWidth="auto"] minimum width px of grid item(number or "auto")
				 * @property {number} [options.minCols=1] the minimum number of columns
				 * @property {number} [options.maxCols=5] the maximum number of columns (for landscape 7 mobile)
				 * @member ns.widget.mobile.GridView
				 */
				this.options = {
					cols: 0, // auto - fit to screen resolution
					reorder: false,
					label: labels.NONE,
					minWidth: "auto",
					minCols: 2,
					maxCols: 5
				};
				this._direction = direction.NEXT;
			};

			/**
			 * Build GridView
			 * @method _build
			 * @param {HTMLElement} element
			 * @return {HTMLElement}
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._build = function (element) {
				element.classList.add("ui-gridview-cols");
				return element;
			};

			/**
			 * Initialize GridView
			 * @method _init
			 * @param {HTMLElement} element
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._init = function (element) {
				var self = this,
					ui = self._ui,
					popup;

				ui.listElements = [].slice.call(self.element.getElementsByTagName("li"));
				self._setItemSize();
				self._setLabel(element);
				self._checkItemLabel();
				self._setReorder(element, self.options.reorder);
				self._calculateListHeight();
				self._initCheckboxState(element);

				self._ui.content = utilsSelectors.getClosestByClass(element, "ui-content") || window;
				self._ui.scrollableParent = getScrollableParent(element) || self._ui.content;
				popup = utilsSelectors.getClosestBySelector(element, popupSelector);
				if (popup) {
					self._inPopup = PopupConstructor(popup);
				}
			};

			function animationEndCallback(event) {
				var classList = event.target.classList;

				if (classList.contains(classes.ITEM)) {
					classList.add(classes.ITEM_ACTIVE);
					event.target.style.animation = "";
				}
			}

			function onSetGridStyle(self) {
				self._setGridStyle();
			}

			prototype._onResize = function () {
				var self = this;

				self.options.cols = 0;
				self.refresh();
			};

			prototype._onResizeTimeOut = function () {
				var self = this;

				clearTimeout(self._resizeTimeout);
				self._resizeTimeout = window.setTimeout(function () {
					self._onResize();
				}, RESIZE_TIMEOUT);
			};

			/**
			 * Bind events for GridView
			 * @method _bindEvents
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._bindEvents = function () {
				var self = this,
					page = self._getParentPage(self.element),
					popup = this._inPopup;

				self._onSetGridStyle = onSetGridStyle.bind(null, self);
				if (popup) {
					utilsEvents.on(popup.element, popupEvents.transition_start, self._refreshSizesCallback);
				}

				self.on("animationend webkitAnimationEnd", animationEndCallback);

				self.on("change", self);
				self.on("load", self, true);
				utilsEvents.on(window, "resize", self, true);

				utilsEvents.on(page, pageEvents.SHOW, self._onSetGridStyle);
			};

			/**
			 * Unbind events for GridView
			 * @method _unbindEvents
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._unbindEvents = function () {
				var self = this,
					element = self.element,
					page = self._getParentPage(element),
					popup = self._inPopup;

				utilsEvents.disableGesture(element);

				utilsEvents.off(element, "drag dragstart dragend dragcancel dragprepare", self);
				utilsEvents.off(element, "pinchin pinchout", self);
				if (popup) {
					utilsEvents.off(popup.element, popupEvents.before_show, this._refreshSizesCallback);
				}
				self.off("animationend webkitAnimationEnd", animationEndCallback);
				self.off("change", self);
				self.off("load", self, true);
				utilsEvents.off(page, pageEvents.SHOW, self._onSetGridStyle);
			};

			/**
			 * Refresh GridView
			 * @method _refresh
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._refresh = function () {
				var self = this,
					ui = self._ui,
					element = self.element;

				self._removeGridStyle();
				ui.listElements = [].slice.call(element.getElementsByTagName("li"));
				self._setItemSize();
				self._setGridStyle();
				self._setLabel(element);
				self._checkItemLabel();
				self._setReorder(element, self.options.reorder);
				self._detectIcons();
				self._calculateListHeight();
				self._ui.content = utilsSelectors.getClosestByClass(element, "ui-content") || window;
				self._ui.scrollableParent = getScrollableParent(element) || self._ui.content;
			};

			/**
			 * Destroy GridView
			 * @method _destroy
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._destroy = function () {
				this._unbindEvents();
				this._removeGridStyle();
				this._inPopup = null;
			};

			/**
			 * Handle events
			 * @method handleEvent
			 * @public
			 * @param {Event} event Event
			 * @member ns.widget.mobile.GridView
			 */
			prototype.handleEvent = function (event) {
				var self = this;

				switch (event.type) {
					case "change":
						self._shadeCheckbox(event.target);
						break;
					case "load":
						self._detectIcon(event.target);
						break;
					case "dragprepare":
						if (event.detail.srcEvent.srcElement.classList.contains(classes.HANDLER)) {
							break;
						}
						event.preventDefault();
						break;
					case "dragstart":
						if (event.detail.srcEvent.srcElement.classList.contains(classes.HANDLER)) {
							self._start(event);
							break;
						}
						event.preventDefault();
						break;
					case "drag":
						self._move(event);
						break;
					case "dragend":
						self._end(event);
						break;
					case "pinchin":
						self._in(event);
						break;
					case "pinchout":
						self._out(event);
						break;
					case "resize":
						self._onResizeTimeOut();
						break;
				}
			};

			/**
			 * Method for dragstart event
			 * @method _start
			 * @protected
			 * @param {Event} event Event
			 * @member ns.widget.mobile.GridView
			 */
			prototype._start = function (event) {
				var self = this,
					element = self.element,
					helper = self._ui.helper,
					helperElement = event.detail.srcEvent.srcElement.parentElement,
					helperElementComputed = window.getComputedStyle(helperElement, null),
					helperStyle = helperElement.style,
					transformProperty = helperElementComputed.getPropertyValue("webkit-transform") ||
						helperElementComputed.getPropertyValue("transform") || "",
					translated = transformProperty.match(MATRIX_REGEXP),
					holder,
					top = 0,
					left = 0;

				self._refreshItemsInfo();
				if (translated.length > 0) {
					top = parseInt(translated[6], 10);
					left = parseInt(translated[5], 10);
				}
				helperElement.classList.add(classes.HELPER);
				holder = self._createHolder();
				element.insertBefore(holder, helperElement);
				element.appendChild(helperElement);
				helperStyle.top = top + "px";
				helperStyle.left = left + "px";

				helper.element = helperElement;
				helper.style = helperStyle;
				helper.position = {
					startTop: top,
					startLeft: left,
					moveTop: top,
					moveLeft: left
				};

				helper.startX = event.detail.estimatedX;
				helper.startY = event.detail.estimatedY;
				helper.width = parseFloat(helperElementComputed.getPropertyValue("width")) || 0;
				helper.height = parseFloat(helperElementComputed.getPropertyValue("height")) || 0;

				self._ui.holder = holder;
				helper.element = helperElement;
				self._ui.helper = helper;
			};

			/**
			 * Method for drag event
			 * @method _move
			 * @protected
			 * @param {Event} event Event
			 * @member ns.widget.mobile.GridView
			 */
			prototype._move = function (event) {
				var self = this,
					ui = self._ui,
					element = self.element,
					listItems = ui.listItems,
					length = listItems.length,
					helper = self._ui.helper,
					style = helper.style,
					position = helper.position,
					helperElement = helper.element,
					startX = helper.startX,
					startY = helper.startY,
					moveX,
					moveY,
					i,
					scrollableParent = self._ui.scrollableParent,
					autoScrollDown,
					autoScrollUp,
					scrollUnit;

				moveY = position.startTop + event.detail.estimatedY - startY;
				moveX = position.startLeft + event.detail.estimatedX - startX;
				autoScrollDown = (element.offsetTop + moveY + helperElement.offsetHeight) - (scrollableParent.offsetHeight + scrollableParent.scrollTop);
				autoScrollUp = scrollableParent.scrollTop - (element.offsetTop + moveY);
				scrollUnit = helperElement.offsetHeight / 5;
				if (autoScrollDown > 0 && ((helperElement.offsetTop + helperElement.offsetHeight) < element.offsetHeight)) {
					scrollableParent.scrollTop += scrollUnit;
					moveY += scrollUnit;
					position.startTop += scrollUnit;
				}
				if (autoScrollUp > 0 && helperElement.offsetTop > 0) {
					scrollableParent.scrollTop -= scrollUnit;
					moveY -= scrollUnit;
					position.startTop -= scrollUnit;
				}
				style.top = moveY + "px";
				style.left = moveX + "px";
				position.moveTop = moveY;
				position.moveLeft = moveX;

				for (i = 0; i < length; i++) {
					if (self._compareOverlapItem(listItems[i])) {
						self._direction ? element.insertBefore(ui.holder, listItems[i].element.nextSibling) : element.insertBefore(ui.holder, listItems[i].element);
						self._refreshItemsInfo();
						self._setItemMargin();
					}
				}
			};

			/**
			 * Method for dragend event
			 * @method _end
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._end = function () {
				var self = this,
					element = self.element,
					helper = self._ui.helper,
					helperElement = helper.element,
					holder = self._ui.holder;

				helperElement.classList.remove(classes.HELPER);
				helper.style.top = 0;
				helper.style.left = 0;
				element.insertBefore(helperElement, holder);
				element.removeChild(holder);
				self._setItemMargin();
				self._ui.helper = {};
			};

			/**
			 * Method for pinchout event
			 * @method _out
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._out = function () {
				var self = this,
					options = self.options,
					cols = options.cols,
					minCols = options.minCols;

				if (cols > minCols) {
					self._minWidth = null;
					options.cols = cols - 1;
					self._refresh();
				}
			};

			/**
			 * Method for pinchin event
			 * @method _in
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._in = function () {
				var self = this,
					options = self.options,
					cols = options.cols,
					maxCols = options.maxCols;

				if (maxCols === null || cols < maxCols) {
					options.cols = cols + 1;
					self._minWidth = null;
					self._refresh();
				}
			};

			/**
			 * Check whether a selected item is overlapped with adjacent items
			 * @method _compareOverlapItem
			 * @protected
			 * @param {HTMLElement} item
			 * @member ns.widget.mobile.GridView
			 */
			prototype._compareOverlapItem = function (item) {
				var self = this,
					helper = self._ui.helper,
					position = helper.position,
					overlapWidth,
					overlapHeight;

				if (helper.element === item.element) {
					return false;
				}

				if (position.moveTop > item.top || (position.moveTop === item.top && position.moveLeft > item.left)) {
					self._direction = direction.PREV;
				} else {
					self._direction = direction.NEXT;
				}

				overlapWidth = position.moveTop > item.top ? item.top + item.height - position.moveTop : position.moveTop + helper.height - item.top;
				overlapHeight = position.moveLeft > item.left ? item.left + item.width - position.moveLeft : position.moveLeft + helper.width - item.left;

				if (overlapWidth <= 0 || overlapHeight <= 0) {
					return false;
				} else if (overlapWidth * overlapHeight > item.height * item.width / 2) {
					return true;
				}
				return false;
			};

			/**
			 * Calculate and set the height of grid view depending on the number of columns
			 * @method _calculateListHeight
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._calculateListHeight = function () {
				var self = this,
					listElements = self._ui.listElements,
					firstLiComputed = listElements.length && window.getComputedStyle(listElements[0], null),
					itemHeight,
					rows;

				rows = Math.ceil(listElements.length / self.options.cols);
				itemHeight = parseFloat(firstLiComputed.getPropertyValue("height")) || 0;

				if (self.element.getAttribute("data-label") === "out") {
					self.element.style.height = (itemHeight * rows) + "px";
				} else {
					self.element.style.height = (itemHeight + 1) * rows + 1 + "px";
				}
			};

			/**
			 * Set checkbox initial state
			 * @method _initCheckboxState
			 * @protected
			 * @param {HTMLElement} element
			 * @member ns.widget.mobile.GridView
			 */
			prototype._initCheckboxState = function (element) {
				var checkboxNodeList = element.querySelectorAll("input[type=checkbox]"),
					i = 0,
					self = this,
					length = checkboxNodeList.length;

				for (i = 0; i < length; i++) {
					self._shadeCheckbox(checkboxNodeList[i]);
				}
			}

			/**
			 * Set darker background for checked element in the grid
			 * @method _shadeCheckbox
			 * @protected
			 * @param {HTMLElement} target
			 * @member ns.widget.mobile.GridView
			 */
			prototype._shadeCheckbox = function (target) {
				target.parentElement.classList.toggle(classes.CHECKED, target.checked);
			}

			/**
			 * Set icon class on transparent image
			 * @method _detectIcon
			 * @protected
			 * @param {HTMLElement} target
			 * @member ns.widget.mobile.GridView
			 */
			prototype._detectIcon = function (target) {
				if (target.complete) {
					target.parentElement.classList.toggle(
						classes.ITEM_HAS_ICON,
						checkTransparency(target)
					);
				}
			}

			/**
			 * Update information of each list item
			 * @method _refreshItemsInfo
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._refreshItemsInfo = function () {
				var self = this,
					listElements = self._ui.listElements,
					length = listElements.length,
					listItems = [],
					translated,
					li,
					i,
					top = 0,
					liComputed = null,
					left = 0,
					transformProperty = "";

				for (i = 0; i < length; i++) {
					li = listElements[i];
					liComputed = window.getComputedStyle(li, null);
					transformProperty = liComputed.getPropertyValue("webkit-transform") ||
						liComputed.getPropertyValue("transform") || "";
					translated = transformProperty.match(MATRIX_REGEXP);
					if (translated && translated.length > 0) {
						top = parseInt(translated[6], 10);
						left = parseInt(translated[5], 10);
					}
					listItems.push({
						top: top,
						left: left,
						height: parseFloat(liComputed.getPropertyValue("width")) || 0,
						width: parseFloat(liComputed.getPropertyValue("width")) || 0,
						element: li
					});
				}

				self._ui.listItems = listItems;

			};

			/**
			 * Create holder element to help reordering
			 * @method _createHolder
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._createHolder = function () {
				var holder = document.createElement("li"),
					classList = holder.classList;

				classList.add(classes.ITEM);
				classList.add(classes.HOLDER);

				return holder;
			};

			/**
			 * Set the margins of each item
			 * @method _setItemMargin
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._setItemMargin = function () {
				var self = this,
					options = self.options,
					// list elements represents current order of list item in DOM tree
					listElements = [].slice.call(self.element.getElementsByTagName("li")),
					i,
					length = listElements.length,
					cols = options.cols,
					elementStyle = null,
					borderSize = self._borderSize;

				// set margin
				for (i = 0; i < length; i++) {
					elementStyle = listElements[i].style;
					// all without last in raw should have right border
					if (i % cols < cols - 1) {
						elementStyle.marginRight = borderSize + "px";
					} else {
						elementStyle.marginRight = "0";
					}
					// first row doesn't have top margin
					if (i > cols - 1) {
						elementStyle.marginTop = borderSize + "px";
					} else {
						elementStyle.marginTop = "0";
					}
				}
			};

			/**
			 * Method detects icons and add specific css class for icon
			 * @method _detectIcons
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._detectIcons = function () {
				var self = this,
					listElements = self._ui.listElements || [];

				listElements.forEach(function (liItem) {
					var image = liItem.querySelector("img");

					if (image) {
						self._detectIcon(image);
					}
				});
			}

			/**
			 * Set the width of each item
			 * @method _setItemSize
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._setItemSize = function () {
				var self = this,
					options = self.options,
					parentComputedStyle = window.getComputedStyle(self.element, null),
					parentWidth = parseFloat(parentComputedStyle.getPropertyValue("width")) || 0,
					minWidth = self._minWidth,
					listElements = self._ui.listElements,
					length = listElements.length,
					cols,
					i,
					width,
					borderSize = self._borderSize,
					elementStyle = null,
					content;

				if (options.minWidth === "auto") {
					minWidth = 0;
				} else {
					minWidth = (minWidth) ? parseInt(minWidth, 10) : null;
				}
				self._minWidth = minWidth;

				cols = options.cols;
				if (cols === 0) { // fit number of columns to screen resolution
					content = window.getComputedStyle(self.element, ":after").content;
					content = content.replace(/[^0-9]+/, "");
					if (content) {
						cols = parseInt(content.replace(/\"/g, ""), 10);
					}
				}
				if (cols === 0 && minWidth > 0) { // if cols are still undefined
					cols = minWidth ? Math.floor(parentWidth / minWidth) : cols;
				}
				if (cols === 0) {
					cols = options.minCols;
				}
				options.cols = cols;

				self._itemSize = (parentWidth - (cols - 1) * borderSize) / cols;
				self._itemHeight = self._itemSize;

				width = self._itemSize + "px";

				self._setItemMargin();

				// set size
				for (i = 0; i < length; i++) {
					elementStyle = listElements[i].style;
					elementStyle.width = width;
					// item height is the same like width
					elementStyle.height = width;
				}
				// check label
				for (i = 0; i < length; i++) {
					// check label
					if (listElements[i].querySelector("*:not(img)")) {
						listElements[i].classList.add(classes.ITEM_HAS_LABEL);
					}
				}
			};

			/**
			 * Check item label and add class to indicate it
			 * @method _checkItemLabel
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._checkItemLabel = function () {
				var self = this,
					listElements = self._ui.listElements,
					length = listElements.length,
					i;

				for (i = 0; i < length; i++) {
					// check label
					if (listElements[i].querySelector(selectors.ANY_NOT_IMAGE)) {
						listElements[i].classList.add(classes.ITEM_HAS_LABEL);
					}
				}
			};

			/**
			 * Get parent page element
			 * @method _getParentPage
			 * @protected
			 * @param {HTMLElement} element
			 * @return {HTMLElement}
			 * @member ns.widget.mobile.GridView
			 */
			prototype._getParentPage = function (element) {
				while (element && element !== document.body) {
					if (element.getAttribute(DATA_ROLE) === "page" || element.classList.contains("ui-page") === true) {
						return element;
					}
					element = element.parentNode;
				}
				return document.body;
			};

			/**
			 * Toggle grid view reordering mode
			 * @method _setReorder
			 * @protected
			 * @param {HTMLElement} element
			 * @param {boolean} reorder
			 * @member ns.widget.mobile.GridView
			 */
			prototype._setReorder = function (element, reorder) {
				var self = this,
					options = self.options,
					page = self._getParentPage(element),
					appbarElement,
					appbar;

				utilsEvents.disableGesture(element);

				if (reorder) {
					utilsEvents.enableGesture(
						element,
						new utilsEvents.gesture.Drag({
							blockVertical: false
						})
					);
					utilsEvents.on(element, "drag dragstart dragend dragcancel dragprepare", self, true);
					utilsEvents.off(element, "pinchin pinchout", self);
					element.classList.add("ui-gridview-reorder");
					// create handlers if not exists
					self._ui.listElements.forEach(function (liItem) {
						var handler = null;

						if (!liItem.querySelector("." + classes.HANDLER)) {
							handler = document.createElement("div");
							handler.classList.add(classes.HANDLER);
							liItem.appendChild(handler);
						}
					});

					// lock AppBar if exists
					if (page) {
						appbarElement = page.querySelector(ns.widget.core.Appbar.selector);
						if (appbarElement) {
							appbar = ns.widget.Appbar(appbarElement);
							appbar.lockExpanding(true);
						}
					}
				} else {
					utilsEvents.enableGesture(
						element,
						new utilsEvents.gesture.Pinch()
					);
					utilsEvents.off(element, "drag dragstart dragend dragcancel dragprepare", self, true);
					utilsEvents.on(element, "pinchin pinchout", self);
					element.classList.remove("ui-gridview-reorder");

					// unlock AppBar if exists
					if (page) {
						appbarElement = page.querySelector(ns.widget.core.Appbar.selector);
						if (appbarElement) {
							appbar = ns.widget.Appbar(appbarElement);
							appbar.lockExpanding(false);
						}
					}
				}

				options.reorder = reorder;
			};

			/**
			 * Set style for grid view
			 * @method _setGridStyle
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._setGridStyle = function () {
				var self = this,
					listElements = self._ui.listElements,
					length = listElements.length,
					options = self.options,
					cols = options.cols,
					rows,
					styleElement,
					styles = [],
					index = 0,
					row,
					col;

				styleElement = document.createElement("style");
				styleElement.type = "text/css";

				rows = Math.ceil(length / cols);

				for (row = 0; row < rows; row++) {
					for (col = 0; col < cols && index < length; col++) {
						listElements[index].style.animation = "grid_show_item cubic-bezier(0.25, 0.46, 0.45, 1.00) 350ms " + (17 * index) + "ms";
						styles.push(self._getTransformStyle(col, row, ++index));
					}
				}
				styleElement.textContent = styles.join("\n");
				styleElement.id = "GridView";
				document.head.appendChild(styleElement);
				self._styleElement = styleElement;
			};

			/**
			 * Set number of cols
			 * @method _setCols
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._setCols = function (element, value) {
				var self = this,
					options = self.options;

				if (value === "auto") {
					options.cols = 0;
				} else {
					options.cols = parseInt(value, 10);
				}

				return true;
			};

			/**
			 * Set number of cols
			 * @method _getCols
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._getCols = function () {
				var self = this,
					options = self.options;

				if (options.cols === 0) {
					return "auto";
				}

				return options.cols;
			};

			/**
			 * Define transform style for positioning of grid items
			 * @method _getTransformStyle
			 * @protected
			 * @param {number} col
			 * @param {number} row
			 * @param {number} index
			 * @member ns.widget.mobile.GridView
			 */
			prototype._getTransformStyle = function (col, row, index) {
				var size = this._itemSize + this._borderSize,
					x = col * size + "px",
					y = row * (this._itemHeight) + Math.max(row - 1, 0) * this._borderSize + "px",
					transform,
					style;

				transform = "{ -webkit-transform: translate3d(" + x + ", " + y + ", 0); transform: translate3d(" + x + ", " + y + ", 0) }";
				style = STYLE_PATTERN.replace("{index}", index) + transform;

				return style;
			};

			/**
			 * Remove style node
			 * @method _removeGridStyle
			 * @protected
			 * @member ns.widget.mobile.GridView
			 */
			prototype._removeGridStyle = function () {
				var styleElement = this._styleElement;

				if (styleElement) {
					styleElement.parentNode.removeChild(styleElement);
					this._styleElement = null;
				}
			};

			/**
			 * Add an item to grid view
			 * @method addItem
			 * @public
			 * @param {HTMLElement} item
			 * @member ns.widget.mobile.GridView
			 */
			prototype.addItem = function (item) {
				var self = this,
					listElements = self._ui.listElements,
					styleElement = self._styleElement,
					styles = styleElement.textContent,
					element = self.element,
					cols = self.options.cols,
					col,
					row,
					length,
					firstLiComputed = listElements.length && window.getComputedStyle(listElements[0], null);

				// append item
				item.classList.add(classes.ITEM);
				item.style.width = (parseFloat(firstLiComputed.getPropertyValue("width")) || 0) + "px";
				element.appendChild(item);
				listElements.push(item);

				// calculate item position
				length = listElements.length;
				row = Math.floor((length - 1) / cols);
				col = (length - 1) % cols;

				// add transform style for item added
				styleElement.textContent = styles.concat("\n" + self._getTransformStyle(col, row, length));
			};

			/**
			 * Remove an item from grid view
			 * @method removeItem
			 * @public
			 * @param {HTMLElement} item
			 * @member ns.widget.mobile.GridView
			 */
			prototype.removeItem = function (item) {
				var self = this,
					element = self.element,
					listElements = self._ui.listElements,
					styleElement = self._styleElement,
					styles = styleElement.textContent.split("\n"),
					index;

				index = listElements.indexOf(item);

				if (index > -1) {
					listElements.splice(index, 1);
					element.removeChild(item);
					styles.pop();
					styleElement.textContent = styles.join("\n");
				}
			};

			/**
			 * Set label type for grid view
			 * @method _setLabel
			 * @protected
			 * @param {HTMLElement} element
			 * @param {string} label
			 * @member ns.widget.mobile.GridView
			 */
			prototype._setLabel = function (element, label) {
				var self = this,
					options = self.options,
					labelCheck;

				labelCheck = label || options.label;

				element.classList.remove(classes.LABEL_IN);
				element.classList.remove(classes.LABEL_OUT);

				if (labelCheck === labels.IN) {
					element.classList.add(classes.LABEL_IN);
				} else if (labelCheck === labels.OUT) {
					element.classList.add(classes.LABEL_OUT);
				}

				options.label = labelCheck;
			};

			BaseKeyboardSupport.registerActiveSelector("." + classes.GRIDLIST + " li." + classes.ITEM);

			ns.widget.mobile.GridView = GridView;

			engine.defineWidget(
				"GridView",
				"ul.ui-gridview, ul[data-role='gridview']",
				[],
				GridView,
				"mobile"
			);
			//>>excludeStart("tauBuildExclude", pragmas.tauBuildExclude);
			return GridView;
		}
	);
	//>>excludeEnd("tauBuildExclude");
}(window.document, ns));
