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
        let baseExpr = node.expr.accept(this);
        
        // Si no hay cuantificador, retornamos la expresión base
        if (!node.qty) return baseExpr;

        // Modificamos la expresión según el cuantificador
        switch(node.qty) {
            case '*':
                return this.generateZeroOrMore(baseExpr);
            case '+':
                return this.generateOneOrMore(baseExpr);
            default:
                return baseExpr;
        }
    }   

    /**
     * @override
     * @param {any} node - Nodo de tipo string a visitar.
     * @returns {string}
     */
    visitString(node) {
        const comparison = node.isCase ? 
            `lower(input(cursor:cursor + ${node.val.length - 1})) == lower("${node.val}")` :
            `"${node.val}" == input(cursor:cursor + ${node.val.length - 1})`;
            
        return `
    if (${comparison}) then
        allocate(character(len=${node.val.length}) :: lexeme)
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





     /**
     * Genera código para el cuantificador * (cero o más ocurrencias)
     * @param {string} baseExpr - Expresión base a cuantificar
     * @returns {string}
     */
     generateZeroOrMore(baseExpr) {
        return `
    start_pos = cursor
    do while (.true.)
        temp_cursor = cursor
        ${baseExpr}
        if (temp_cursor == cursor) exit
    end do
    if (cursor > start_pos) then
        lexeme = input(start_pos:cursor-1)
        return
    end if
        `;
    }

    /**
     * Genera código para el cuantificador + (una o más ocurrencias)
     * @param {string} baseExpr - Expresión base a cuantificar
     * @returns {string}
     */
    generateOneOrMore(baseExpr) {
        return `
    start_pos = cursor
    found_one = .false.
    do while (.true.)
        temp_cursor = cursor
        ${baseExpr}
        if (temp_cursor == cursor) exit
        found_one = .true.
    end do
    if (found_one) then
        lexeme = input(start_pos:cursor-1)
        return
    end if
        `;
    }
}
