/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.Collaboration

import * as Events from './events/events.js';
import {WorkspaceSvg} from './workspace_svg.js';
import * as dom from './utils/dom.js';
import {Svg} from './utils/svg.js';

/**
 * 协作编辑管理器
 */
export class CollaborationManager {
  private workspace: WorkspaceSvg;
  private websocket: WebSocket | null = null;
  private isConnected: boolean = false;
  private userId: string;
  private username: string;
  private userColor: string;
  private collaborators: Map<string, Collaborator> = new Map();
  private lockedBlocks: Map<string, string> = new Map(); // blockId -> userId
  private chatMessages: ChatMessage[] = [];
  private connectionStatus: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  /**
   * 构造函数
   * @param workspace 工作区
   */
  constructor(workspace: WorkspaceSvg) {
    this.workspace = workspace;
    this.userId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    this.username = 'User ' + this.userId.substring(0, 5);
    this.userColor = this.generateRandomColor();

    // 注册事件监听器
    this.registerEventListeners();
  }

  /**
   * 生成随机颜色
   * @returns 颜色字符串
   */
  private generateRandomColor(): string {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  /**
   * 注册事件监听器
   */
  private registerEventListeners(): void {
    // 监听工作区事件
    this.workspace.addChangeListener((e: Events.Abstract) => {
      if (this.isConnected) {
        this.sendEvent(e);
      }
    });

    // 监听块选择事件 - 通过监听Selected事件类型
    this.workspace.addChangeListener((e: Events.Abstract) => {
      if (e.type === Events.SELECTED && this.isConnected) {
        const selectedEvent = e as Events.Selected;
        this.sendUserSelection(selectedEvent.newElementId || '');
      }
    });
  }

  /**
   * 连接到协作服务器
   * @param url 服务器URL
   */
  public connect(url: string): void {
    this.connectionStatus = 'connecting';

    try {
      this.websocket = new WebSocket(url);

      this.websocket.onopen = () => {
        this.isConnected = true;
        this.connectionStatus = 'connected';
        this.sendHelloMessage();
      };

      this.websocket.onmessage = (event) => {
        this.handleMessage(JSON.parse(event.data));
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      this.websocket.onclose = () => {
        this.isConnected = false;
        this.connectionStatus = 'disconnected';
      };
    } catch (error) {
      console.error('Failed to connect:', error);
      this.connectionStatus = 'disconnected';
    }
  }

  /**
   * 发送事件到服务器
   * @param event 事件
   */
  private sendEvent(event: Events.Abstract): void {
    const message = {
      type: 'event',
      userId: this.userId,
      event: event.toJson(),
    };
    this.sendMessage(message);
  }

  /**
   * 发送用户选择的块到服务器
   * @param blockId 块ID
   */
  private sendUserSelection(blockId: string): void {
    const message = {
      type: 'userSelection',
      userId: this.userId,
      blockId: blockId,
    };
    this.sendMessage(message);
  }

  /**
   * 发送消息到服务器
   * @param message 消息
   */
  private sendMessage(message: any): void {
    if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
      this.websocket.send(JSON.stringify(message));
    }
  }

  /**
   * 处理来自服务器的消息
   * @param message 消息
   */
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'hello':
        this.handleHelloMessage(message);
        break;
      case 'event':
        this.handleRemoteEvent(message);
        break;
      case 'selection':
        this.handleSelectionMessage(message);
        break;
      case 'lock':
        this.handleLockMessage(message);
        break;
      case 'unlock':
        this.handleUnlockMessage(message);
        break;
      case 'userList':
        this.handleUserListMessage(message);
        break;
      case 'chat':
        this.handleChatMessage(message);
        break;
      default:
        console.error('Unknown message type:', message.type);
    }
  }

  /**
   * 处理hello消息
   * @param _message 消息
   */
  private handleHelloMessage(_message: any): void {
    // 处理服务器返回的初始数据
  }

  /**
   * 处理远程事件
   * @param message 消息
   */
  private handleRemoteEvent(message: any): void {
    // 如果事件是当前用户发出的，则忽略
    if (message.userId === this.userId) {
      return;
    }

    // 应用远程事件
    const event = Events.fromJson(message.event, this.workspace);
    if (event) {
      Events.fire(event);
    }
  }

  /**
   * 处理选择消息
   * @param message 消息
   */
  private handleSelectionMessage(message: any): void {
    const userId = message.userId;
    const blockId = message.blockId;

    const collaborator = this.collaborators.get(userId);
    if (collaborator) {
      collaborator.selectedBlock = blockId;
    }

    // 更新高亮显示
    this.updateBlockHighlights();
  }

  /**
   * 处理锁定消息
   * @param message 消息
   */
  private handleLockMessage(message: any): void {
    const blockId = message.blockId;
    const userId = message.userId;

    this.lockedBlocks.set(blockId, userId);
    this.updateBlockLockState(blockId);
  }

  /**
   * 处理解锁消息
   * @param message 消息
   */
  private handleUnlockMessage(message: any): void {
    const blockId = message.blockId;

    this.lockedBlocks.delete(blockId);
    this.updateBlockLockState(blockId);
  }

  /**
   * 处理用户列表消息
   * @param message 消息
   */
  private handleUserListMessage(message: any): void {
    const users = message.users;
    this.collaborators.clear();

    for (const user of users) {
      this.collaborators.set(user.userId, user);
    }

    // 更新高亮显示
    this.updateBlockHighlights();
  }

  /**
   * 处理聊天消息
   * @param message 消息
   */
  private handleChatMessage(message: any): void {
    this.chatMessages.push(message.message);
  }

  /**
   * 更新块的锁定状态
   * @param blockId 块ID
   */
  private updateBlockLockState(blockId: string): void {
    const block = this.workspace.getBlockById(blockId);
    if (block) {
      const isLocked = this.lockedBlocks.has(blockId);
      const lockedBy = this.lockedBlocks.get(blockId);

      block.setEditable(!isLocked);

      // 在块上显示锁定信息
      const blockSvg = block as any;
      if (blockSvg && blockSvg.getSvgRoot) {
        // 移除旧的锁定标记
        const oldLockMark = blockSvg.getSvgRoot().querySelector('.blocklyLockMark');
        if (oldLockMark) {
          oldLockMark.remove();
        }

        if (isLocked && lockedBy) {
          // 创建锁定标记
          const lockMark = dom.createSvgElement(
              Svg.CIRCLE,
              {
                'class': 'blocklyLockMark',
                'r': '8',
                'fill': 'red',
                'stroke': 'white',
                'stroke-width': '2',
              },
              blockSvg.getSvgRoot()
          );

          // 定位锁定标记
          const bbox = blockSvg.getBoundingRectangle();
          if (bbox) {
            lockMark.setAttribute('cx', (bbox.x + bbox.width - 10).toString());
            lockMark.setAttribute('cy', (bbox.y + 10).toString());
          }
        }
      }
    }
  }

  /**
   * 发送hello消息到服务器
   */
  private sendHelloMessage(): void {
    const message = {
      type: 'hello',
      userId: this.userId,
      username: this.username,
      color: this.userColor
    };
    this.sendMessage(message);
  }

  /**
   * 断开与服务器的连接
   */
  public disconnect(): void {
    if (this.websocket) {
      this.websocket.close();
    }
  }

  /**
   * 获取当前连接状态
   * @returns 连接状态
   */
  public getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' {
    return this.connectionStatus;
  }

  /**
   * 获取当前用户ID
   * @returns 用户ID
   */
  public getUserId(): string {
    return this.userId;
  }

  /**
   * 获取当前用户名
   * @returns 用户名
   */
  public getUsername(): string {
    return this.username;
  }

  /**
   * 获取当前用户颜色
   * @returns 用户颜色
   */
  public getUserColor(): string {
    return this.userColor;
  }

  /**
   * 获取所有协作者
   * @returns 协作者列表
   */
  public getCollaborators(): Map<string, Collaborator> {
    return new Map(this.collaborators);
  }

  /**
   * 获取所有锁定的块
   * @returns 锁定的块列表
   */
  public getLockedBlocks(): Map<string, string> {
    return new Map(this.lockedBlocks);
  }

  /**
   * 获取所有聊天消息
   * @returns 聊天消息列表
   */
  public getChatMessages(): ChatMessage[] {
    return [...this.chatMessages];
  }

  /**
   * 设置用户名
   * @param username 用户名
   */
  public setUsername(username: string): void {
    this.username = username;
    if (this.isConnected) {
      this.sendMessage({
        type: 'updateUser',
        userId: this.userId,
        username: username
      });
    }
  }

  /**
   * 设置用户颜色
   * @param color 用户颜色
   */
  public setUserColor(color: string): void {
    this.userColor = color;
    if (this.isConnected) {
      this.sendMessage({
        type: 'updateUser',
        userId: this.userId,
        color: color
      });
    }
  }

  /**
   * 发送聊天消息
   * @param content 消息内容
   */
  public sendChatMessage(content: string): void {
    const message = {
      type: 'chat',
      userId: this.userId,
      content: content,
      timestamp: Date.now()
    };
    this.sendMessage(message);
  }

  /**
   * 锁定块
   * @param blockId 块ID
   */
  public lockBlock(blockId: string): void {
    const message = {
      type: 'lock',
      userId: this.userId,
      blockId: blockId
    };
    this.sendMessage(message);
  }

  /**
   * 解锁块
   * @param blockId 块ID
   */
  public unlockBlock(blockId: string): void {
    const message = {
      type: 'unlock',
      userId: this.userId,
      blockId: blockId
    };
    this.sendMessage(message);
  }

  /**
   * 更新块高亮
   */
  private updateBlockHighlights(): void {
    // Remove existing highlights
    const allBlocks = this.workspace.getAllBlocks();
    for (const block of allBlocks) {
      const blockSvg = block as any;
      if (blockSvg.highlightPath_) {
        blockSvg.highlightPath_.remove();
        delete blockSvg.highlightPath_;
      }
    }

    // Add highlights for selected blocks
    for (const collaborator of this.collaborators.values()) {
      if (collaborator.selectedBlock) {
        const block = this.workspace.getBlockById(collaborator.selectedBlock);
        if (block) {
          const blockSvg = block as any;
          const bbox = blockSvg.getBoundingRectangle();
          if (bbox) {
            const highlightPath = dom.createSvgElement(
                Svg.PATH,
                {
                  'class': 'blocklyCollabHighlight',
                  'stroke': collaborator.color,
                  'stroke-width': '3',
                  'fill': 'none',
                  'filter': 'url(#blocklyDropShadowFilter)',
                },
                blockSvg.getSvgRoot()
            );

            blockSvg.highlightPath_ = highlightPath;
            blockSvg.highlightPath_.setAttribute(
                'd',
                `M ${bbox.x} ${bbox.y} L ${bbox.x + bbox.width} ${bbox.y} L ${bbox.x + bbox.width} ${bbox.y + bbox.height} L ${bbox.x} ${bbox.y + bbox.height} Z`,
            );
          }
        }
      }
    }
  }
}

/**
 * 协作者接口
 */
export interface Collaborator {
  userId: string;
  username: string;
  color: string;
  isOnline: boolean;
  selectedBlock?: string;
}

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  userId: string;
  username: string;
  message: string;
  timestamp: number;
}

/**
 * 初始化协作管理器
 * @param workspace 工作区
 * @returns 协作管理器实例
 */
export function initCollaboration(workspace: WorkspaceSvg): CollaborationManager {
  return new CollaborationManager(workspace);
}

/**
 * 将协作模块添加到Blockly命名空间
 */
// 定义全局Window接口扩展
declare global {
  interface Window {
    Blockly?: any;
  }
}

// 在模块加载时将CollaborationManager添加到Blockly命名空间
if (typeof window !== 'undefined' && window.Blockly) {
  window.Blockly.CollaborationManager = CollaborationManager;
  window.Blockly.initCollaboration = initCollaboration;
}