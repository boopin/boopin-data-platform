(function(window, document) {
  'use strict';

  // Configuration
  var BP = window._bp || [];
  var apiKey = null;
  var endpoint = null;
  var anonymousId = null;
  var sessionId = null;
  var initialized = false;

  // Generate unique ID
  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Get or create anonymous ID
  function getAnonymousId() {
    var stored = localStorage.getItem('_bp_aid');
    if (stored) return stored;
    var id = generateId();
    localStorage.setItem('_bp_aid', id);
    return id;
  }

  // Get or create session ID (expires after 30 min of inactivity)
  function getSessionId() {
    var stored = sessionStorage.getItem('_bp_sid');
    var lastActivity = sessionStorage.getItem('_bp_last');
    var now = Date.now();
    
    if (stored && lastActivity && (now - parseInt(lastActivity)) < 30 * 60 * 1000) {
      sessionStorage.setItem('_bp_last', now.toString());
      return stored;
    }
    
    var id = generateId();
    sessionStorage.setItem('_bp_sid', id);
    sessionStorage.setItem('_bp_last', now.toString());
    return id;
  }

  // Get UTM parameters
  function getUTMParams() {
    var params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      utmTerm: params.get('utm_term'),
      utmContent: params.get('utm_content')
    };
  }

  // Send event to server
  function sendEvent(eventType, properties) {
    if (!initialized || !apiKey) {
      console.warn('[Boopin] Pixel not initialized');
      return;
    }

    var utm = getUTMParams();
    var payload = {
      anonymousId: anonymousId,
      sessionId: sessionId,
      eventType: eventType,
      properties: properties || {},
      pageUrl: window.location.href,
      pagePath: window.location.pathname,
      pageTitle: document.title,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      utmSource: utm.utmSource,
      utmMedium: utm.utmMedium,
      utmCampaign: utm.utmCampaign,
      utmTerm: utm.utmTerm,
      utmContent: utm.utmContent
    };

    // Use sendBeacon if available (more reliable for page unload)
    if (navigator.sendBeacon && eventType === 'page_view') {
      var blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey
        },
        body: JSON.stringify(payload),
        keepalive: true
      }).catch(function(err) {
        console.error('[Boopin] Failed to send event:', err);
      });
    }
  }

  // Track page view
  function trackPageView() {
    var startTime = Date.now();
    var maxScroll = 0;

    // Track scroll depth
    function updateScroll() {
      var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var scrollPercent = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;
      if (scrollPercent > maxScroll) maxScroll = scrollPercent;
    }
    window.addEventListener('scroll', updateScroll);

    // Send page view
    sendEvent('page_view', {});

    // Send time on page and scroll depth when leaving
    window.addEventListener('beforeunload', function() {
      var timeOnPage = Math.round((Date.now() - startTime) / 1000);
      sendEvent('page_leave', {
        time_on_page: timeOnPage,
        scroll_depth: maxScroll
      });
    });
  }

  // Track clicks
  function trackClicks() {
    document.addEventListener('click', function(e) {
      var target = e.target;
      
      // Find clickable parent
      while (target && target !== document) {
        if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.onclick) {
          break;
        }
        target = target.parentNode;
      }

      if (!target || target === document) return;

      var props = {
        element: target.tagName.toLowerCase(),
        text: (target.innerText || '').substring(0, 100),
        href: target.href || null,
        id: target.id || null,
        class: target.className || null
      };

      sendEvent('click', props);
    });
  }

  // Track form submissions
  function trackForms() {
    document.addEventListener('submit', function(e) {
      var form = e.target;
      if (form.tagName !== 'FORM') return;

      var props = {
        form_id: form.id || null,
        form_name: form.name || null,
        form_action: form.action || null,
        fields: Array.from(form.elements)
          .filter(function(el) { return el.name; })
          .map(function(el) { return el.name; })
      };

      sendEvent('form_submit', props);
    });
  }

  // Public methods
  window.boopin = {
    track: function(eventType, properties) {
      sendEvent(eventType, properties);
    },
    identify: function(userId, traits) {
      sendEvent('identify', Object.assign({ user_id: userId }, traits || {}));
    },
    page: function() {
      trackPageView();
    }
  };

  // Process queued commands
  function processQueue() {
    for (var i = 0; i < BP.length; i++) {
      var args = BP[i];
      var cmd = args[0];
      
      if (cmd === 'init') {
        apiKey = args[1];
        // Determine endpoint from script URL or use default
        var scripts = document.getElementsByTagName('script');
        for (var j = 0; j < scripts.length; j++) {
          if (scripts[j].src && scripts[j].src.indexOf('pixel.js') !== -1) {
            var url = new URL(scripts[j].src);
            endpoint = url.origin + '/api/track';
            break;
          }
        }
        if (!endpoint) {
          endpoint = window.location.origin + '/api/track';
        }
        
        anonymousId = getAnonymousId();
        sessionId = getSessionId();
        initialized = true;
        
        // Auto-track
        trackPageView();
        trackClicks();
        trackForms();
      } else if (cmd === 'track') {
        sendEvent(args[1], args[2]);
      } else if (cmd === 'identify') {
        window.boopin.identify(args[1], args[2]);
      }
    }
  }

  // Initialize
  if (document.readyState === 'complete') {
    processQueue();
  } else {
    window.addEventListener('load', processQueue);
  }

})(window, document);
