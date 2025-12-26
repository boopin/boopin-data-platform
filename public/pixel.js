(function(window, document) {
  'use strict';

  var BP = window._bp || [];
  var apiKey = null;
  var endpoint = null;
  var anonymousId = null;
  var sessionId = null;
  var initialized = false;

  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function getAnonymousId() {
    try {
      var stored = localStorage.getItem('_bp_aid');
      if (stored) return stored;
      var id = generateId();
      localStorage.setItem('_bp_aid', id);
      return id;
    } catch (e) {
      return generateId();
    }
  }

  function getSessionId() {
    try {
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
    } catch (e) {
      return generateId();
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

  function sendEvent(eventType, properties) {
    if (!initialized || !apiKey || !endpoint) {
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

    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey
      },
      body: JSON.stringify(payload),
      mode: 'cors'
    }).then(function(response) {
      if (!response.ok) {
        console.error('[Boopin] Track failed:', response.status);
      }
    }).catch(function(err) {
      console.error('[Boopin] Failed to send event:', err);
    });
  }

  function trackPageView() {
    sendEvent('page_view', {});
  }

  function trackClicks() {
    document.addEventListener('click', function(e) {
      var target = e.target;
      
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
        id: target.id || null
      };

      sendEvent('click', props);
    });
  }

  function trackForms() {
    document.addEventListener('submit', function(e) {
      var form = e.target;
      if (form.tagName !== 'FORM') return;

      var props = {
        form_id: form.id || null,
        form_name: form.name || null,
        form_action: form.action || null
      };

      sendEvent('form_submit', props);
    });
  }

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

  function processQueue() {
    for (var i = 0; i < BP.length; i++) {
      var args = BP[i];
      var cmd = args[0];
      
      if (cmd === 'init') {
        apiKey = args[1];
        var scripts = document.getElementsByTagName('script');
        for (var j = 0; j < scripts.length; j++) {
          if (scripts[j].src && scripts[j].src.indexOf('pixel.js') !== -1) {
            try {
              var url = new URL(scripts[j].src);
              endpoint = url.origin + '/api/track';
            } catch (e) {
              endpoint = 'https://boopin-data-platform.vercel.app/api/track';
            }
            break;
          }
        }
        if (!endpoint) {
          endpoint = 'https://boopin-data-platform.vercel.app/api/track';
        }
        
        anonymousId = getAnonymousId();
        sessionId = getSessionId();
        initialized = true;
        
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

  if (document.readyState === 'complete') {
    processQueue();
  } else {
    window.addEventListener('load', processQueue);
  }

})(window, document);
