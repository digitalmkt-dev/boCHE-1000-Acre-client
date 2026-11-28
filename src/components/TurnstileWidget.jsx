import { useEffect, useRef } from "react";

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function TurnstileWidget({ onVerify, onExpire, onError, resetKey = 0 }) {
    const containerRef = useRef(null);
    const widgetIdRef = useRef(null);
    const callbacksRef = useRef({ onVerify, onExpire, onError });
    callbacksRef.current = { onVerify, onExpire, onError };

    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

    useEffect(() => {
        if (!siteKey || !containerRef.current) return;

        let cancelled = false;

        const renderWidget = () => {
            if (cancelled || !containerRef.current || !window.turnstile) return;

            if (widgetIdRef.current !== null) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }

            widgetIdRef.current = window.turnstile.render(containerRef.current, {
                sitekey: siteKey,
                theme: "light",
                callback: (token) => callbacksRef.current.onVerify?.(token),
                "expired-callback": () => callbacksRef.current.onExpire?.(),
                "error-callback": () => callbacksRef.current.onError?.(),
            });
        };

        if (window.turnstile) {
            renderWidget();
        } else {
            let script = document.getElementById(SCRIPT_ID);
            if (!script) {
                script = document.createElement("script");
                script.id = SCRIPT_ID;
                script.src = SCRIPT_SRC;
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
            }

            const handleLoad = () => renderWidget();
            script.addEventListener("load", handleLoad);

            return () => {
                cancelled = true;
                script.removeEventListener("load", handleLoad);
                if (widgetIdRef.current !== null && window.turnstile) {
                    window.turnstile.remove(widgetIdRef.current);
                    widgetIdRef.current = null;
                }
            };
        }

        return () => {
            cancelled = true;
            if (widgetIdRef.current !== null && window.turnstile) {
                window.turnstile.remove(widgetIdRef.current);
                widgetIdRef.current = null;
            }
        };
    }, [siteKey]);

    useEffect(() => {
        if (resetKey > 0 && widgetIdRef.current !== null && window.turnstile) {
            window.turnstile.reset(widgetIdRef.current);
        }
    }, [resetKey]);

    if (!siteKey) return null;

    return <div ref={containerRef} className="my-2" />;
}

export default TurnstileWidget;

