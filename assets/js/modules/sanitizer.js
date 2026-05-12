/**
 * ============================================================
 * MÓDULO SANITIZER - Proteção XSS
 * ============================================================
 */

const Sanitizer = {
    
    /**
     * Sanitiza string HTML
     */
    clean(html) {
        if (typeof DOMPurify !== 'undefined') {
            return DOMPurify.sanitize(html, {
                ALLOWED_TAGS: ['span', 'i', 'div', 'button', 'br', 'strong', 'b'],
                ALLOWED_ATTR: ['class', 'style', 'title', 'id']
            });
        }
        // Fallback básico
        return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                   .replace(/on\w+="[^"]*"/gi, '');
    },
    
    /**
     * Sanitiza texto puro (remove todas as tags)
     */
    text(value) {
        if (!value) return '';
        const div = document.createElement('div');
        div.textContent = value;
        return div.innerHTML;
    },
    
    /**
     * Sanitiza número
     */
    number(value, def = 0) {
        const num = parseFloat(value);
        return isNaN(num) ? def : num;
    },
    
    /**
     * Sanitiza inteiro
     */
    integer(value, def = 0) {
        const num = parseInt(value, 10);
        return isNaN(num) ? def : num;
    }
};

window.Sanitizer = Sanitizer;