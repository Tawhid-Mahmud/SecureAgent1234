import { AbstractParser, EnclosingContext } from "../../constants";
import * as pythonParser from 'python-ast';

export class PythonParser implements AbstractParser {
  /**
   * Finds the context around specified lines
   */
  findEnclosingContext(
    file: string,
    lineStart: number,
    lineEnd: number
  ): EnclosingContext | null {
    try {
      // Basic input validation
      if (!file || typeof file !== 'string') {
        console.error('Error: Invalid file input');
        return null;
      }

      if (lineStart < 1 || lineEnd < lineStart) {
        console.error('Error: Invalid line numbers');
        return null;
      }

      // Parse the Python code into an AST
      const ast = pythonParser.parse(file);

      // Find the enclosing context
      return this.findContext(ast, lineStart, lineEnd);

    } catch (error) {
      console.error('Error parsing Python code:', 
        error instanceof Error ? error.message : 'Unknown error'
      );
      return null;
    }
  }

  /**
   * Recursively finds the context in the AST
   */
  private findContext(node: any, lineStart: number, lineEnd: number): EnclosingContext | null {
    // Check if the node has line numbers
    if (!node.lineno || !node.end_lineno) {
      return null;
    }

    // Check if the current node contains the target lines
    if (node.lineno <= lineStart && node.end_lineno >= lineEnd) {
      // Return the context information
      return {
        startLine: node.lineno,
        endLine: node.end_lineno,
        type: this.getNodeType(node),
        name: node.name || 'anonymous'
      };
    }

    // Recursively check child nodes
    for (const key in node) {
      const child = node[key];
      if (child && typeof child === 'object') {
        const context = this.findContext(child, lineStart, lineEnd);
        if (context) {
          return context; // Return the first found context
        }
      }
    }

    return null; // No context found
  }

  /**
   * Determines the type of the node
   */
  private getNodeType(node: any): string {
    switch (node.type) {
      case 'FunctionDef':
        return 'function';
      case 'ClassDef':
        return 'class';
      case 'AsyncFunctionDef':
        return 'async_function';
      default:
        return 'unknown';
    }
  }

  /**
   * Validates Python code with basic error handling
   */
  dryRun(file: string): { valid: boolean; error: string } {
    try {
      // Basic input validation
      if (!file || typeof file !== 'string') {
        return {
          valid: false,
          error: 'Invalid input: file must be a string'
        };
      }

      // Try to parse the code
      pythonParser.parse(file);
      return { valid: true, error: '' };

    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}