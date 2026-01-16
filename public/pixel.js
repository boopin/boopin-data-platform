(function(window, document) {
  'use strict';

  // ============================================
  // PULSE ANALYTICS - Enhanced Tracking Pixel
  // ============================================

  // Initialize _bp on window if not exists
  window._bp = window._bp || [];
  var BP = window._bp;
  var siteId = null;  // Changed from apiKey to siteId for multi-site support
  var endpoint = null;
  var anonymousId = null;
  var sessionId = null;
  var initialized = false;

  // Time tracking variables
  var pageLoadTime = Date.now();
  var sessionStartTime = null;
  var engagedTime = 0;
  var lastActivityTime = Date.now();
  var isTabVisible = true;
  var engagementInterval = null;
  var timeTrackingFired = {};

  // Scroll tracking variables
  var scrollDepthMax = 0;
  var scrollDepthsFired = {};

  // Form tracking variables
  var formStartTimes = {};
  var formFieldsCompleted = {};

  // Cart tracking variables
  var cartItems = [];
  var cartTotal = 0;

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================

  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getAnonymousId() {
    try {
      var stored = localStorage.getItem('_pa_aid');
      if (stored) return stored;
      var id = generateId();
      localStorage.setItem('_pa_aid', id);
      return id;
    } catch (e) {
      return generateId();
    }
  }

  function getSessionId() {
    try {
      var stored = sessionStorage.getItem('_pa_sid');
      var lastActivity = sessionStorage.getItem('_pa_last');
      var now = Date.now();
      
      if (stored && lastActivity && (now - parseInt(lastActivity)) < 30 * 60 * 1000) {
        sessionStorage.setItem('_pa_last', now.toString());
        return stored;
      }
      
      var id = generateId();
      sessionStorage.setItem('_pa_sid', id);
      sessionStorage.setItem('_pa_last', now.toString());
      sessionStorage.setItem('_pa_start', now.toString());
      return id;
    } catch (e) {
      return generateId();
    }
  }

  function getSessionStartTime() {
    try {
      var stored = sessionStorage.getItem('_pa_start');
      return stored ? parseInt(stored) : Date.now();
    } catch (e) {
      return Date.now();
    }
  }

  function getUTMParams() {
    try {
      var params = new URLSearchParams(window.location.search);
      return {
        utmSource: params.get('utm_source'),
        utmMedium: params.get('utm_medium'),
        utmCampaign: params.get('utm_campaign'),
        utmTerm: params.get('utm_term'),
        utmContent: params.get('utm_content')
      };
    } catch (e) {
      return {};
    }
  }

  function getScrollPercent() {
    var h = document.documentElement;
    var b = document.body;
    var st = 'scrollTop';
    var sh = 'scrollHeight';
    return Math.round((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100);
  }

  function isExternalLink(url) {
    try {
      var link = new URL(url, window.location.origin);
      return link.hostname !== window.location.hostname;
    } catch (e) {
      return false;
    }
  }

  // ============================================
  // CORE TRACKING FUNCTION
  // ============================================

  function sendEvent(eventType, properties) {
    if (!initialized || !siteId || !endpoint) {
      console.warn('[PulseAnalytics] Pixel not initialized');
      return;
    }

    var utm = getUTMParams();
    var now = Date.now();
    var timeOnPage = Math.round((now - pageLoadTime) / 1000);
    var timeOnSite = Math.round((now - sessionStartTime) / 1000);

    var payload = {
      siteId: siteId,  // Added for multi-site support
      anonymousId: anonymousId,
      sessionId: sessionId,
      eventType: eventType,
      properties: properties || {},
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      pageTitle: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      timeOnPage: timeOnPage,
      timeOnSite: timeOnSite,
      engagedTime: Math.round(engagedTime / 1000),
      scrollDepth: scrollDepthMax,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      utmTerm: utm.utmTerm,
      utmContent: utm.utmContent
    };

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // Removed X-API-Key header - now using siteId in request body
      },
      body: JSON.stringify(payload),
      mode: 'cors'
    }).then(function(response) {
      if (!response.ok) {
        console.error('[PulseAnalytics] Track failed:', response.status);
      }
    }).catch(function(err) {
      console.error('[PulseAnalytics] Failed to send event:', err);
    });
  }

  // ============================================
  // AUTO-TRACKING: JAVASCRIPT ERRORS
  // ============================================

  function trackErrors() {
    // Track runtime errors
    window.addEventListener('error', function(event) {
      var error = event.error || {};

      sendEvent('javascript_error', {
        message: event.message || 'Unknown error',
        stack: error.stack || null,
        filename: event.filename || null,
        lineno: event.lineno || null,
        colno: event.colno || null,
        error_type: error.name || 'Error',
        user_agent: navigator.userAgent,
        page_url: window.location.href
      });
    });

    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', function(event) {
      var reason = event.reason || {};

      sendEvent('javascript_error', {
        message: reason.message || event.reason || 'Unhandled Promise Rejection',
        stack: reason.stack || null,
        error_type: 'UnhandledPromiseRejection',
        user_agent: navigator.userAgent,
        page_url: window.location.href,
        promise_rejection: true
      });
    });
  }

  // ============================================
  // AUTO-TRACKING: PAGE VIEWS
  // ============================================

  function trackPageView() {
    sendEvent('page_view', {
      title: document.title,
      url: window.location.href,
      path: window.location.pathname
    });
  }

  // ============================================
  // AUTO-TRACKING: SCROLL DEPTH
  // ============================================

  function trackScrollDepth() {
    var thresholds = [25, 50, 75, 100];
    
    function checkScroll() {
      var percent = getScrollPercent();
      if (percent > scrollDepthMax) {
        scrollDepthMax = percent;
      }
      
      thresholds.forEach(function(threshold) {
        if (percent >= threshold && !scrollDepthsFired[threshold]) {
          scrollDepthsFired[threshold] = true;
          sendEvent('scroll_depth', {
            depth: threshold,
            maxDepth: scrollDepthMax
          });
        }
      });
    }

    var scrollTimeout;
    window.addEventListener('scroll', function() {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(checkScroll, 150);
    });
  }

  // ============================================
  // AUTO-TRACKING: TIME ON PAGE & ENGAGED TIME
  // ============================================

  function trackTime() {
    var timeThresholds = [30, 60, 180, 300, 600]; // seconds
    
    // Track visibility changes
    document.addEventListener('visibilitychange', function() {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastActivityTime = Date.now();
      }
    });

    // Track user activity
    ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(function(evt) {
      document.addEventListener(evt, function() {
        lastActivityTime = Date.now();
      }, { passive: true });
    });

    // Update engaged time every second
    engagementInterval = setInterval(function() {
      var now = Date.now();
      
      // Only count as engaged if tab visible and active in last 30 seconds
      if (isTabVisible && (now - lastActivityTime) < 30000) {
        engagedTime += 1000;
      }

      // Fire time-based events
      var timeOnPage = Math.round((now - pageLoadTime) / 1000);
      timeThresholds.forEach(function(threshold) {
        if (timeOnPage >= threshold && !timeTrackingFired['page_' + threshold]) {
          timeTrackingFired['page_' + threshold] = true;
          sendEvent('time_on_page', {
            seconds: threshold,
            engaged_seconds: Math.round(engagedTime / 1000),
            scroll_depth: scrollDepthMax
          });
        }
      });
    }, 1000);
  }

  // ============================================
  // AUTO-TRACKING: PAGE LEAVE
  // ============================================

  function trackPageLeave() {
    function handleLeave() {
      var now = Date.now();
      sendEvent('page_leave', {
        time_on_page: Math.round((now - pageLoadTime) / 1000),
        engaged_time: Math.round(engagedTime / 1000),
        scroll_depth: scrollDepthMax,
        exit_url: document.activeElement ? document.activeElement.href : null
      });
    }

    // Use both events for better coverage
    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);
  }

  // ============================================
  // AUTO-TRACKING: CLICKS
  // ============================================

  function trackClicks() {
    document.addEventListener('click', function(e) {
      var target = e.target;
      
      // Find clickable element
      while (target && target !== document) {
        if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.onclick) {
          break;
        }
        target = target.parentNode;
      }

      if (!target || target === document) return;

      var props = {
        element: target.tagName.toLowerCase(),
        text: (target.innerText || '').substring(0, 100).trim(),
        href: target.href || null,
        id: target.id || null,
        classes: target.className || null
      };

      // Check for outbound link
      if (target.href && isExternalLink(target.href)) {
        sendEvent('outbound_click', {
          destination_url: target.href,
          link_text: props.text,
          element_id: props.id
        });
      } else {
        sendEvent('click', props);
      }
    });
  }

  // ============================================
  // AUTO-TRACKING: FORMS
  // ============================================

  function trackForms() {
    // Track form field focus (form start)
    document.addEventListener('focusin', function(e) {
      var target = e.target;
      if (!target || !target.form) return;
      
      var form = target.form;
      var formId = form.id || form.name || 'unknown_form';
      
      if (!formStartTimes[formId]) {
        formStartTimes[formId] = Date.now();
        formFieldsCompleted[formId] = [];
        
        sendEvent('form_start', {
          form_id: formId,
          form_name: form.name || null,
          form_action: form.action || null,
          first_field: target.name || target.id || target.type
        });
      }
    });

    // Track form field completion
    document.addEventListener('change', function(e) {
      var target = e.target;
      if (!target || !target.form) return;
      
      var form = target.form;
      var formId = form.id || form.name || 'unknown_form';
      var fieldName = target.name || target.id || target.type;
      
      if (formFieldsCompleted[formId] && formFieldsCompleted[formId].indexOf(fieldName) === -1) {
        formFieldsCompleted[formId].push(fieldName);
      }
    });

    // Track form submission
    document.addEventListener('submit', function(e) {
      var form = e.target;
      if (form.tagName !== 'FORM') return;

      var formId = form.id || form.name || 'unknown_form';
      var startTime = formStartTimes[formId] || Date.now();
      var timeToComplete = Math.round((Date.now() - startTime) / 1000);

      var props = {
        form_id: formId,
        form_name: form.name || null,
        form_action: form.action || null,
        fields_completed: formFieldsCompleted[formId] || [],
        time_to_complete: timeToComplete
      };

      sendEvent('form_submit', props);
      
      // Clean up
      delete formStartTimes[formId];
      delete formFieldsCompleted[formId];
    });

    // Track form abandonment
    window.addEventListener('beforeunload', function() {
      Object.keys(formStartTimes).forEach(function(formId) {
        var fieldsCompleted = formFieldsCompleted[formId] || [];
        if (fieldsCompleted.length > 0) {
          sendEvent('form_abandon', {
            form_id: formId,
            fields_completed: fieldsCompleted,
            fields_count: fieldsCompleted.length,
            time_spent: Math.round((Date.now() - formStartTimes[formId]) / 1000)
          });
        }
      });
    });
  }

  // ============================================
  // AUTO-TRACKING: CART ABANDONMENT
  // ============================================

  function trackCartAbandonment() {
    window.addEventListener('beforeunload', function() {
      // Check if there are items in cart
      if (cartItems.length > 0) {
        sendEvent('cart_abandon', {
          items: cartItems,
          items_count: cartItems.length,
          cart_total: cartTotal,
          currency: 'AED'
        });
      }
    });
  }

  // ============================================
  // HELPER METHODS: E-COMMERCE
  // ============================================

  function productView(product) {
    sendEvent('product_view', {
      product_id: product.id || product.sku,
      product_name: product.name,
      product_price: product.price,
      product_category: product.category || null,
      product_brand: product.brand || null,
      currency: product.currency || 'AED'
    });
  }

  function addToCart(product, quantity) {
    quantity = quantity || 1;
    
    var item = {
      product_id: product.id || product.sku,
      product_name: product.name,
      product_price: product.price,
      quantity: quantity,
      category: product.category || null
    };
    
    cartItems.push(item);
    cartTotal += (product.price * quantity);
    
    // Store in session for abandonment tracking
    try {
      sessionStorage.setItem('_pa_cart', JSON.stringify(cartItems));
      sessionStorage.setItem('_pa_cart_total', cartTotal.toString());
    } catch (e) {}
    
    sendEvent('add_to_cart', {
      product_id: item.product_id,
      product_name: item.product_name,
      product_price: item.product_price,
      quantity: quantity,
      category: item.category,
      cart_total: cartTotal,
      cart_items_count: cartItems.length,
      currency: product.currency || 'AED'
    });
  }

  function removeFromCart(product, quantity) {
    quantity = quantity || 1;
    
    var index = -1;
    for (var i = 0; i < cartItems.length; i++) {
      if (cartItems[i].product_id === (product.id || product.sku)) {
        index = i;
        break;
      }
    }
    
    if (index > -1) {
      var item = cartItems[index];
      cartTotal -= (item.product_price * quantity);
      
      if (item.quantity <= quantity) {
        cartItems.splice(index, 1);
      } else {
        cartItems[index].quantity -= quantity;
      }
    }
    
    // Update session storage
    try {
      sessionStorage.setItem('_pa_cart', JSON.stringify(cartItems));
      sessionStorage.setItem('_pa_cart_total', cartTotal.toString());
    } catch (e) {}
    
    sendEvent('remove_from_cart', {
      product_id: product.id || product.sku,
      product_name: product.name,
      quantity: quantity,
      cart_total: cartTotal,
      cart_items_count: cartItems.length,
      currency: product.currency || 'AED'
    });
  }

  function viewCart() {
    sendEvent('cart_view', {
      items: cartItems,
      items_count: cartItems.length,
      cart_total: cartTotal,
      currency: 'AED'
    });
  }

  function beginCheckout(cart) {
    cart = cart || {};
    
    sendEvent('begin_checkout', {
      items: cart.items || cartItems,
      items_count: cart.items_count || cartItems.length,
      cart_total: cart.total || cartTotal,
      currency: cart.currency || 'AED',
      coupon: cart.coupon || null
    });
  }

  function addShippingInfo(shipping) {
    sendEvent('add_shipping_info', {
      shipping_method: shipping.method,
      shipping_cost: shipping.cost || 0,
      cart_total: cartTotal,
      currency: shipping.currency || 'AED'
    });
  }

  function addPaymentInfo(payment) {
    sendEvent('add_payment_info', {
      payment_method: payment.method,
      cart_total: cartTotal,
      currency: payment.currency || 'AED'
    });
  }

  function purchase(order) {
    sendEvent('purchase', {
      order_id: order.id || order.order_id,
      total: order.total,
      subtotal: order.subtotal || null,
      tax: order.tax || null,
      shipping: order.shipping || null,
      discount: order.discount || null,
      coupon: order.coupon || null,
      currency: order.currency || 'AED',
      items: order.items || cartItems,
      items_count: order.items ? order.items.length : cartItems.length,
      payment_method: order.payment_method || null
    });
    
    // Clear cart after purchase
    cartItems = [];
    cartTotal = 0;
    try {
      sessionStorage.removeItem('_pa_cart');
      sessionStorage.removeItem('_pa_cart_total');
    } catch (e) {}
  }

  function refund(order) {
    sendEvent('refund', {
      order_id: order.id || order.order_id,
      refund_amount: order.amount || order.total,
      reason: order.reason || null,
      currency: order.currency || 'AED'
    });
  }

  // ============================================
  // HELPER METHODS: LEAD GENERATION
  // ============================================

  function leadForm(formName, data) {
    sendEvent('lead_form', {
      form_name: formName,
      lead_data: data || {},
      source: getUTMParams().utmSource || 'direct'
    });
  }

  function callbackRequest(phone, data) {
    sendEvent('callback_request', {
      phone: phone,
      preferred_time: data ? data.preferred_time : null,
      service_interested: data ? data.service : null
    });
  }

  // ============================================
  // HELPER METHODS: CONTENT ENGAGEMENT
  // ============================================

  function videoStart(video) {
    sendEvent('video_start', {
      video_id: video.id,
      video_title: video.title || null,
      video_duration: video.duration || null,
      video_provider: video.provider || null
    });
  }

  function videoProgress(video, percent) {
    sendEvent('video_progress', {
      video_id: video.id,
      video_title: video.title || null,
      percent: percent,
      watch_time: video.current_time || null
    });
  }

  function videoComplete(video) {
    sendEvent('video_complete', {
      video_id: video.id,
      video_title: video.title || null,
      video_duration: video.duration || null,
      watch_time: video.watch_time || null
    });
  }

  function fileDownload(file) {
    sendEvent('file_download', {
      file_name: file.name,
      file_type: file.type || null,
      file_size: file.size || null,
      file_url: file.url || null
    });
  }

  function search(term, resultsCount) {
    sendEvent('search', {
      search_term: term,
      results_count: resultsCount || null
    });
  }

  function share(platform, content) {
    sendEvent('share', {
      platform: platform,
      content_type: content ? content.type : null,
      content_id: content ? content.id : null,
      content_title: content ? content.title : null
    });
  }

  // ============================================
  // HELPER METHODS: USER LIFECYCLE
  // ============================================

  function identify(userId, traits) {
    traits = traits || {};
    sendEvent('identify', {
      user_id: userId,
      email: traits.email || userId,
      name: traits.name || null,
      phone: traits.phone || null,
      company: traits.company || null,
      custom: traits
    });
  }

  function signUp(method, data) {
    sendEvent('sign_up', {
      method: method || 'email',
      user_data: data || {}
    });
  }

  function login(method) {
    sendEvent('login', {
      method: method || 'email'
    });
  }

  function logout() {
    sendEvent('logout', {});
  }

  // ============================================
  // PUBLIC API
  // ============================================

  window.pulseAnalytics = {
    // Core methods
    track: function(eventType, properties) {
      sendEvent(eventType, properties);
    },
    page: function() {
      trackPageView();
    },
    
    // Identity
    identify: identify,
    signUp: signUp,
    login: login,
    logout: logout,
    
    // E-commerce
    productView: productView,
    addToCart: addToCart,
    removeFromCart: removeFromCart,
    viewCart: viewCart,
    beginCheckout: beginCheckout,
    addShippingInfo: addShippingInfo,
    addPaymentInfo: addPaymentInfo,
    purchase: purchase,
    refund: refund,
    
    // Lead Generation
    leadForm: leadForm,
    callbackRequest: callbackRequest,
    
    // Content
    videoStart: videoStart,
    videoProgress: videoProgress,
    videoComplete: videoComplete,
    fileDownload: fileDownload,
    search: search,
    share: share,
    
    // Utility
    getAnonymousId: function() { return anonymousId; },
    getSessionId: function() { return sessionId; }
  };

  // ============================================
  // INITIALIZATION
  // ============================================

  function loadCartFromSession() {
    try {
      var stored = sessionStorage.getItem('_pa_cart');
      var storedTotal = sessionStorage.getItem('_pa_cart_total');
      if (stored) {
        cartItems = JSON.parse(stored);
      }
      if (storedTotal) {
        cartTotal = parseFloat(storedTotal);
      }
    } catch (e) {}
  }

  function processQueue() {
    for (var i = 0; i < BP.length; i++) {
      var args = BP[i];
      var cmd = args[0];

      if (cmd === 'init') {
        siteId = args[1];  // Changed from apiKey to siteId

        // Auto-detect endpoint from script URL
        var scripts = document.getElementsByTagName('script');
        for (var j = 0; j < scripts.length; j++) {
          if (scripts[j].src && scripts[j].src.indexOf('pixel.js') !== -1) {
            try {
              var url = new URL(scripts[j].src);
              endpoint = url.origin + '/api/track';
            } catch (e) {
              endpoint = 'https://pulse-analytics-data-platform.vercel.app/api/track';
            }
            break;
          }
        }
        if (!endpoint) {
          endpoint = 'https://pulse-analytics-data-platform.vercel.app/api/track';
        }

        anonymousId = getAnonymousId();
        sessionId = getSessionId();
        sessionStartTime = getSessionStartTime();
        initialized = true;

        // Load cart from session
        loadCartFromSession();

        // Initialize all auto-tracking
        trackPageView();
        trackClicks();
        trackForms();
        trackScrollDepth();
        trackTime();
        trackPageLeave();
        trackCartAbandonment();
        trackErrors();  // Added error tracking

        console.log('[PulseAnalytics] Initialized successfully');

      } else if (cmd === 'track') {
        sendEvent(args[1], args[2]);
      } else if (cmd === 'identify') {
        identify(args[1], args[2]);
      }
    }
  }

  // Override push to auto-process new commands
  var originalPush = BP.push;
  var customPush = function() {
    var result = originalPush.apply(BP, arguments);

    // Process commands immediately if we can
    var newCommands = Array.prototype.slice.call(arguments);
    for (var i = 0; i < newCommands.length; i++) {
      var args = newCommands[i];
      var cmd = args[0];

      if (cmd === 'init' && !initialized) {
        // Process the entire queue when init comes in
        setTimeout(function() {
          processQueue();
        }, 0);
      } else if (cmd === 'track' && initialized) {
        sendEvent(args[1], args[2]);
      } else if (cmd === 'identify' && initialized) {
        identify(args[1], args[2]);
      }
    }

    return result;
  };

  BP.push = customPush;
  window._bp.push = customPush;

  // Initial queue processing
  if (document.readyState === 'complete') {
    processQueue();
  } else {
    window.addEventListener('load', processQueue);
  }

  // Also try processing queue on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      if (!initialized && BP.length > 0) {
        processQueue();
      }
    });
  }

})(window, document);
