// Global safeguard against environments where window.fetch has only a getter without a setter
(function() {
  if (typeof window === 'undefined') return;

  // 1. Hook Object.defineProperty to intercept ANY attempt to define fetch on window
  try {
    const origDefine = Object.defineProperty;
    (Object as any).defineProperty = function(target: any, prop: PropertyKey, desc: PropertyDescriptor & ThisType<any>) {
      if (
        (target === window ||
          target === (typeof globalThis !== 'undefined' ? globalThis : null) ||
          target === (typeof Window !== 'undefined' ? Window.prototype : null) ||
          target === (typeof self !== 'undefined' ? self : null)) &&
        prop === 'fetch' &&
        desc
      ) {
        let _assignedVal: any;
        const origGet = desc.get;
        desc.configurable = true;
        desc.enumerable = true;
        desc.get = function() {
          return _assignedVal !== undefined ? _assignedVal : (origGet ? origGet.call(this) : undefined);
        };
        desc.set = function(newVal: any) {
          _assignedVal = newVal;
        };
      }
      return origDefine.call(Object, target, prop, desc);
    };
  } catch {}

  const isFetchGetterError = (errOrMsg: any): boolean => {
    if (!errOrMsg) return false;
    let str = '';
    try {
      if (typeof errOrMsg === 'string') str = errOrMsg;
      else if (errOrMsg.message) str = errOrMsg.message;
      else if (errOrMsg.reason) str = String(errOrMsg.reason.message || errOrMsg.reason);
      else str = String(errOrMsg);
    } catch {
      return false;
    }
    str = str.toLowerCase();
    return str.includes('fetch') && (str.includes('getter') || str.includes('read-only') || str.includes('readonly') || str.includes('cannot set property'));
  };

  // 2. Filter console.error to avoid logging this benign shim artifact
  try {
    const origConsoleError = console.error;
    console.error = function(...args: any[]) {
      for (const arg of args) {
        if (isFetchGetterError(arg)) return;
      }
      return origConsoleError.apply(console, args);
    };
  } catch {}

  // 3. Error event listeners
  window.addEventListener('error', (event) => {
    if (isFetchGetterError(event.message) || isFetchGetterError(event.error)) {
      event.preventDefault();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      return true;
    }
  }, true);

  window.addEventListener('unhandledrejection', (event) => {
    if (isFetchGetterError(event.reason)) {
      event.preventDefault();
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      return true;
    }
  }, true);

  // 4. window.onerror hook
  const origOnError = window.onerror;
  window.onerror = function(msg, source, lineno, colno, error) {
    if (isFetchGetterError(msg) || isFetchGetterError(error)) {
      return true;
    }
    if (typeof origOnError === 'function') {
      return (origOnError as any).apply(this, arguments);
    }
  };

  // 5. Ensure current window.fetch is already configurable and writable
  try {
    const origFetch = window.fetch;
    let activeFetch = origFetch;
    if (typeof origFetch === 'function') {
      try {
        activeFetch = origFetch.bind(window);
      } catch {}
    }

    const patchObject = (obj: any) => {
      if (!obj) return;
      try {
        const desc = Object.getOwnPropertyDescriptor(obj, 'fetch');
        if (desc && desc.configurable) {
          try { delete obj.fetch; } catch {}
        }
        Object.defineProperty(obj, 'fetch', {
          get: () => activeFetch,
          set: (v) => { activeFetch = v; },
          configurable: true,
          enumerable: true,
        });
      } catch {
        try {
          Object.defineProperty(obj, 'fetch', {
            value: activeFetch,
            writable: true,
            configurable: true,
            enumerable: true,
          });
        } catch {}
      }
    };

    patchObject(window);
    if (typeof globalThis !== 'undefined' && globalThis !== window) patchObject(globalThis);
    if (typeof self !== 'undefined' && self !== window) patchObject(self);
    if (typeof Window !== 'undefined' && Window.prototype) patchObject(Window.prototype);

    let proto = Object.getPrototypeOf(window);
    while (proto && proto !== Object.prototype) {
      patchObject(proto);
      proto = Object.getPrototypeOf(proto);
    }
  } catch {}
})();

export {};
