import {
  ArgumentListCtx,
  BaseJavaCstVisitorWithDefaults,
  BinaryExpressionCtx,
  BooleanLiteralCtx,
  ClassBodyDeclarationCtx,
  ConditionalExpressionCtx,
  ConstructorDeclarationCtx,
  ConstructorDeclaratorCtx,
  EnumBodyCtx,
  EnumBodyDeclarationsCtx,
  EnumConstantCtx,
  EnumConstantListCtx,
  EnumDeclarationCtx,
  ExpressionCtx,
  FormalParameterCtx,
  FormalParameterListCtx,
  FqnOrRefTypeCtx,
  FqnOrRefTypePartCommonCtx,
  FqnOrRefTypePartFirstCtx,
  FqnOrRefTypePartRestCtx,
  IntegerLiteralCtx,
  LiteralCtx,
  PrimaryCtx,
  PrimaryPrefixCtx,
  TypeIdentifierCtx,
  UnaryExpressionCtx,
  VariableDeclaratorIdCtx,
  VariableParaRegularParameterCtx,
} from "java-parser";
import { zip } from "./utils.js";

type Value = string | number | boolean | null;
type EnumConstant = { name: string; values: Value[] };

export class EnumCollector extends BaseJavaCstVisitorWithDefaults {
  parserResult: Record<string, Value>[] = [];
  enumName: string;

  constructor(enumName: string) {
    super();
    this.enumName = enumName;
    this.validateVisitor();
  }

  argumentList(ctx: ArgumentListCtx) {
    return ctx.expression.map((node) => this.visit(node));
  }

  binaryExpression(ctx: BinaryExpressionCtx) {
    return this.visit(ctx.unaryExpression);
  }

  booleanLiteral(ctx: BooleanLiteralCtx) {
    return !!ctx.True;
  }

  classBodyDeclaration(ctx: ClassBodyDeclarationCtx, partOfEnum: boolean) {
    if (partOfEnum) return this.visit(ctx.constructorDeclaration ?? []);
    return super.classBodyDeclaration(ctx);
  }

  conditionalExpression(ctx: ConditionalExpressionCtx) {
    return this.visit(ctx.binaryExpression);
  }

  constructorDeclaration(ctx: ConstructorDeclarationCtx) {
    return this.visit(ctx.constructorDeclarator);
  }

  constructorDeclarator(ctx: ConstructorDeclaratorCtx) {
    return this.visit(ctx.formalParameterList ?? []);
  }

  enumDeclaration(ctx: EnumDeclarationCtx) {
    const name = this.visit(ctx.typeIdentifier);
    if (name === this.enumName) {
      this.parserResult = this.visit(ctx.enumBody);
    }
  }

  enumBody(ctx: EnumBodyCtx) {
    const keySets = this.visit(ctx.enumBodyDeclarations ?? []) as string[][];
    const members: EnumConstant[] = this.visit(ctx.enumConstantList ?? []);

    return members.map(({ name, values }) => {
      const keys =
        keySets.find((k) => k.length === values.length) ?? keySets[0];
      return Object.fromEntries([["enumName", name], ...zip(keys, values)]);
    });
  }

  enumBodyDeclarations(ctx: EnumBodyDeclarationsCtx) {
    return (
      ctx.classBodyDeclaration?.filter(
        (n) => n.children.constructorDeclaration,
      ) ?? []
    ).map((node) => this.visit(node, true));
  }

  enumConstantList(ctx: EnumConstantListCtx): EnumConstant[] {
    return ctx.enumConstant.map((node) => this.visit(node));
  }

  enumConstant(ctx: EnumConstantCtx): EnumConstant {
    return {
      name: ctx.Identifier[0].image,
      values: ctx.argumentList ? this.visit(ctx.argumentList) : [],
    };
  }

  expression(ctx: ExpressionCtx) {
    return this.visit(ctx.conditionalExpression ?? []);
  }

  formalParameterList(ctx: FormalParameterListCtx) {
    return ctx.formalParameter.map((node) => this.visit(node));
  }

  formalParameter(ctx: FormalParameterCtx) {
    return this.visit(ctx.variableParaRegularParameter ?? []);
  }

  fqnOrRefType(ctx: FqnOrRefTypeCtx) {
    if (ctx.fqnOrRefTypePartRest) return this.visit(ctx.fqnOrRefTypePartRest);
    return this.visit(ctx.fqnOrRefTypePartFirst);
  }

  fqnOrRefTypePartCommon(ctx: FqnOrRefTypePartCommonCtx) {
    return ctx.Identifier?.[0].image;
  }

  fqnOrRefTypePartFirst(ctx: FqnOrRefTypePartFirstCtx) {
    return this.visit(ctx.fqnOrRefTypePartCommon);
  }

  fqnOrRefTypePartRest(ctx: FqnOrRefTypePartRestCtx) {
    return this.visit(ctx.fqnOrRefTypePartCommon);
  }

  integerLiteral(ctx: IntegerLiteralCtx) {
    if (ctx.BinaryLiteral) return parseInt(ctx.BinaryLiteral[0].image, 2);
    if (ctx.OctalLiteral) return parseInt(ctx.OctalLiteral[0].image, 8);
    if (ctx.DecimalLiteral) return parseInt(ctx.DecimalLiteral[0].image, 10);
    if (ctx.HexLiteral) return parseInt(ctx.HexLiteral[0].image, 16);
  }

  literal(ctx: LiteralCtx) {
    if (ctx.StringLiteral) {
      const quoted = ctx.StringLiteral[0].image;
      return quoted.substring(1, quoted.length - 1);
    }
    if (ctx.booleanLiteral) return this.visit(ctx.booleanLiteral);
    if (ctx.integerLiteral) return this.visit(ctx.integerLiteral);
    if (ctx.Null) return null;
  }

  primary(ctx: PrimaryCtx) {
    return this.visit(ctx.primaryPrefix);
  }

  primaryPrefix(ctx: PrimaryPrefixCtx) {
    if (ctx.literal) return this.visit(ctx.literal);
    if (ctx.fqnOrRefType) return this.visit(ctx.fqnOrRefType);
  }

  typeIdentifier(ctx: TypeIdentifierCtx) {
    return ctx.Identifier[0].image;
  }

  unaryExpression(ctx: UnaryExpressionCtx) {
    const negative = ctx.UnaryPrefixOperator?.[0].image === "-";
    const value = this.visit(ctx.primary);

    return negative ? -1 * value : value;
  }

  variableParaRegularParameter(ctx: VariableParaRegularParameterCtx) {
    return this.visit(ctx.variableDeclaratorId);
  }

  variableDeclaratorId(ctx: VariableDeclaratorIdCtx) {
    return ctx.Identifier?.[0].image;
  }
}
