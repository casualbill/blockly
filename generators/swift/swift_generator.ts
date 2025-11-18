/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Swift code generator class, including helper methods for
 * generating Swift for blocks.
 */

import type {Block} from '../../core/block.js';
import {CodeGenerator} from '../../core/generator.js';
import {inputTypes} from '../../core/inputs/input_types.js';
import {Names, NameType} from '../../core/names.js';
import * as stringUtils from '../../core/utils/string.js';
import * as Variables from '../../core/variables.js';
import type {Workspace} from '../../core/workspace.js';

/**
 * Order of operation ENUMs.
 * https://docs.swift.org/swift-book/LanguageGuide/Expressions.html#ID300
 */
// prettier-ignore
export enum Order {
  ATOMIC = 0,            // 0 "" ...
  FUNCTION_CALL = 1,     // ()
  MEMBER = 2,            // . []
  UNARY = 3,             // ! ~ + - prefix ++ prefix --
  MULTIPLICATION = 4.1,  // * / %
  ADDITION = 4.2,        // + -
  BITWISE_SHIFT = 5,     // << >>
  RELATIONAL = 6,        // < <= > >= is
  EQUALITY = 7,          // == != === !==
  BITWISE_AND = 8,       // &
  BITWISE_XOR = 9,       // ^
  BITWISE_OR = 10,       // |
  LOGICAL_AND = 11,      // &&
  LOGICAL_OR = 12,       // ||
  TERNARY = 13,          // ?:}
  ASSIGNMENT = 14,       // = += -= *= /= %= <<= >>= &= ^= |= ?= ??=
  COMMA = 15,            // ,
  NONE = 99,             // (...)
}

/**
 * Swift code generator class.
 */
export class SwiftGenerator extends CodeGenerator {
  /** List of outer-inner pairings that do NOT require parentheses. */
  ORDER_OVERRIDES: [Order, Order][] = [
    // (foo()).bar -> foo().bar
    // (foo())[0] -> foo()[0]
    [Order.FUNCTION_CALL, Order.MEMBER],
    // (foo())() -> foo()()
    [Order.FUNCTION_CALL, Order.FUNCTION_CALL],
    // (foo.bar).baz -> foo.bar.baz
    // (foo.bar)[0] -> foo.bar[0]
    // (foo[0]).bar -> foo[0].bar
    // (foo[0])[1] -> foo[0][1]
    [Order.MEMBER, Order.MEMBER],
    // (foo.bar)() -> foo.bar()
    // (foo[0])() -> foo[0]()
    [Order.MEMBER, Order.FUNCTION_CALL],

    // !(!foo) -> !!foo
    [Order.UNARY, Order.UNARY],
    // a * (b * c) -> a * b * c
    [Order.MULTIPLICATION, Order.MULTIPLICATION],
    // a + (b + c) -> a + b + c
    [Order.ADDITION, Order.ADDITION],
    // a && (b && c) -> a && b && c
    [Order.LOGICAL_AND, Order.LOGICAL_AND],
    // a || (b || c) -> a || b || c
    [Order.LOGICAL_OR, Order.LOGICAL_OR],
  ];

  /** @param name Name of the language the generator is for. */
  constructor(name = 'Swift') {
    super(name);
    this.isInitialized = false;
    
    // Create a dictionary of reserved words
    this.addReservedWords(
      'associatedtype,class,deinit,enum,extension,fileprivate,func,import,' +
      'init,inout,internal,let,open,operator,private,protocol,public,' +
      'static,struct,subscript,typealias,var,' +
      'break,case,continue,default,defer,do,else,fallthrough,for,guard,if,in,' +
      'repeat,return,switch,where,while,' +
      'as,Any,catch,false,is,nil,rethrows,super,self,Self,throw,throws,true,' +
      'try,' +
      'associativity,convenience,dynamic,didSet,final,get,indirect,inout,lazy,' +
      'mutating,nonmutating,optional,override,postfix,prefix,Protocol,required,' +
      'static,subscript,Type,unowned,weak,willSet'
    );
  }

  /**
   * Initializes the database of variable names.
   * @param workspace Workspace to generate code from.
   */
  init(workspace: Workspace) {
    super.init(workspace);

    // Create a dictionary of variable names
    if (!this.nameDB_) {
      this.nameDB_ = new Names(this.RESERVED_WORDS_);
    } else {
      this.nameDB_.reset();
    }

    this.nameDB_.setVariableMap(workspace.getVariableMap());
    this.nameDB_.populateVariables(workspace);
    this.nameDB_.populateProcedures(workspace);

    this.isInitialized = true;
  }

  /**
   * Escapes a string as a Swift string literal.
   * @param string Text to escape.
   * @returns Escaped string.
   */
  quote_(string: string): string {
    string = string.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    return '"' + string.replace(/"/g, '\\"') + '"';
  }

  /**
   * Generates code for the specified block.
   * @param block The block to generate code for.
   * @param generator The generator to use for rendering.
   * @returns Generated code.
   */
  static forBlock(block: Block, generator: SwiftGenerator): string | null {
    return generator.blockToCode(block);
  }
}