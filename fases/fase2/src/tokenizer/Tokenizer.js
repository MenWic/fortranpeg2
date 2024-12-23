import Visitor from '../visitor/Visitor.js';
import { Rango } from '../visitor/CST.js';
import { generateCaracteres } from './utils.js';

/**
 * Clase Tokenizer que extiende la funcionalidad de Visitor
 */
export default class Tokenizer extends Visitor {
    /**
     * @override
     * @param {any} node - Nodo de producciones a visitar.
     * @returns {any}
     */
    visitProducciones(node) {
        return node.expr.accept(this);
    }

    /**
     * @override
     * @param {any} node - Nodo de opciones a visitar.
     * @returns {string}
     */
    visitOpciones(node) {
        return node.exprs
            .map((expr) => expr.accept(this))
            .filter((str) => str)
            .join('\n');
    }

    /**
     * @override
     * @param {any} node - Nodo de uniones a visitar.
     * @returns {string}
     */
    visitUnion(node) {
        return node.exprs
            .map((expr) => expr.accept(this))
            .filter((str) => str)
            .join('\n');
    }

    /**
     * @override
     * @param {any} node - Nodo de expresiones a visitar.
     * @returns {any}
     */
    visitExpresion(node) {
        return node.expr.accept(this);
    }

    /**
     * @override
     * @param {any} node - Nodo de tipo string a visitar.
     * @returns {string}
     */
    visitString(node) {
        return `
    if ("${node.val}" == input(cursor:cursor + ${node.val.length - 1})) then
        allocate( character(len=${node.val.length}) :: lexeme)
        lexeme = input(cursor:cursor + ${node.val.length - 1})
        cursor = cursor + ${node.val.length}
        return
    end if
    `;
    }

    /**
     * @override
     * @param {any} node - Nodo de clases a visitar.
     * @returns {string}
     */
    visitClase(node) {
        return `
    i = cursor
    ${generateCaracteres(node.chars.filter((node) => typeof node === 'string'))}
    ${node.chars
        .filter((node) => node instanceof Rango)
        .map((range) => range.accept(this))
        .join('\n')}
        `;
    }

    /**
     * @override
     * @param {any} node - Nodo de rangos a visitar.
     * @returns {string}
     */
    visitRango(node) {
        return `
    if (input(i:i) >= "${node.bottom}" .and. input(i:i) <= "${node.top}") then
        lexeme = input(cursor:i)
        cursor = i + 1
        return
    end if
        `;
    }

    /**
     * @override
     * @param {any} node - Nodo de identificadores a visitar.
     * @returns {string}
     */
    visitIdentificador(node) {
        return '';
    }

    /**
     * @override
     * @param {any} node - Nodo de puntos a visitar.
     * @returns {string}
     */
    visitPunto(node) {
        return '';
    }

    /**
     * @override
     * @param {any} node - Nodo de fin a visitar.
     * @returns {string}
     */
    visitFin(node) {
        return '';
    }
}
