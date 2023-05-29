import * as ts from 'typescript';

// Create a TypeScript Compiler API factory function to generate proxy classes
// Usage example:
// `generateProxiesForGrainInterfaces('./path/to/your/grain_interfaces.ts');`
function createProxyFactory(
  grainInterface: ts.InterfaceDeclaration
): ts.ClassDeclaration {
  const className = ts.createIdentifier(`${grainInterface.name.text}Proxy`);
  const classHeritageClause = ts.createHeritageClause(
    ts.SyntaxKind.ImplementsKeyword,
    [grainInterface.name]
  );

  const methods = grainInterface.members
    .filter(ts.isMethodSignature)
    .map((method) => {
      const methodName = method.name;
      const parameters = method.parameters.map((parameter) =>
        ts.createParameter(undefined, undefined, undefined, parameter.name)
      );
      const methodBody = ts.createBlock([], true);
      return ts.createMethod(
        undefined,
        undefined,
        undefined,
        methodName,
        undefined,
        undefined,
        parameters,
        method.type,
        methodBody
      );
    });

  return ts.createClassDeclaration(
    undefined,
    undefined,
    className,
    undefined,
    [classHeritageClause],
    methods
  );
}

// Create a TypeScript Compiler API printer to print the generated proxy classes as TypeScript code
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

/**
 * The main function simply filters the source file's statements to find grain
 * interface declarations and calls the factory function for each interface,
 * printing and saving the generated proxy classes.
 * @param sourceFilePath
 */
function generateProxiesForGrainInterfaces(sourceFilePath: string): void {
  const program = ts.createProgram([sourceFilePath], {});
  const sourceFile = program.getSourceFile(sourceFilePath);

  if (sourceFile !== undefined) {
    const grainInterfaces = sourceFile.statements.filter(
      ts.isInterfaceDeclaration
    );

    grainInterfaces?.forEach((grainInterface) => {
      const proxyClass = createProxyFactory(grainInterface);
      const proxyClassCode = printer.printNode(
        ts.EmitHint.Unspecified,
        proxyClass,
        sourceFile
      );

      // Save the generated proxy class code to a separate file
      // You can use the 'fs' module or other file system libraries to handle file writing
    });
  }
}
