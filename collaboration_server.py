#!/usr/bin/env python3
"""
Blockly协作编辑服务器
使用WebSocket协议实现实时通信
"""

import asyncio
import json
import uuid
from websockets.server import WebSocketServerProtocol, serve


class CollaborationServer:
    def __init__(self):
        self.clients = {}  # client_id: (websocket, client_info)
        self.locked_blocks = {}  # block_id: client_id

    async def handle_client(self, websocket: WebSocketServerProtocol):
        client_id = str(uuid.uuid4())
        client_info = {}

        try:
            # 处理客户端消息
            async for message in websocket:
                data = json.loads(message)
                await self.handle_message(websocket, client_id, data)
        except Exception as e:
            print(f"Client {client_id} error: {e}")
        finally:
            # 客户端断开连接
            await self.remove_client(client_id)

    async def handle_message(self, websocket: WebSocketServerProtocol, client_id: str, data: dict):
        message_type = data.get('type')

        if message_type == 'hello':
            # 新客户端连接
            client_info = {
                'userId': data['userId'],
                'username': data['username'],
                'color': data['color'],
                'isOnline': True
            }
            self.clients[client_id] = (websocket, client_info)

            # 广播新用户加入
            await self.broadcast_except(websocket, {
                'type': 'hello',
                **client_info
            })

            # 发送当前用户列表和锁定块信息
            await websocket.send(json.dumps({
                'type': 'userList',
                'users': [info for _, info in self.clients.values()]
            }))
            await websocket.send(json.dumps({
                'type': 'lockList',
                'lockedBlocks': self.locked_blocks
            }))

        elif message_type == 'event':
            # 广播代码块事件
            await self.broadcast_except(websocket, data)

        elif message_type == 'selection':
            # 广播用户选择
            await self.broadcast_except(websocket, data)

        elif message_type == 'lock':
            # 锁定块
            block_id = data['blockId']
            if block_id not in self.locked_blocks:
                self.locked_blocks[block_id] = data['userId']
                await self.broadcast({
                    'type': 'lock',
                    **data
                })

        elif message_type == 'unlock':
            # 解锁块
            block_id = data['blockId']
            if block_id in self.locked_blocks:
                del self.locked_blocks[block_id]
                await self.broadcast({
                    'type': 'unlock',
                    **data
                })

        elif message_type == 'chat':
            # 广播聊天消息
            await self.broadcast(data)

    async def remove_client(self, client_id: str):
        if client_id in self.clients:
            _, client_info = self.clients[client_id]
            del self.clients[client_id]

            # 广播用户离开
            client_info['isOnline'] = False
            await self.broadcast({
                'type': 'userLeave',
                **client_info
            })

            # 解锁该用户锁定的所有块
            blocks_to_unlock = [block_id for block_id, uid in self.locked_blocks.items() if uid == client_info['userId']]
            for block_id in blocks_to_unlock:
                del self.locked_blocks[block_id]
                await self.broadcast({
                    'type': 'unlock',
                    'userId': client_info['userId'],
                    'blockId': block_id
                })

    async def broadcast(self, message: dict):
        if not self.clients:
            return

        message_str = json.dumps(message)
        await asyncio.gather(*[websocket.send(message_str) for websocket, _ in self.clients.values()])

    async def broadcast_except(self, exclude_websocket: WebSocketServerProtocol, message: dict):
        if not self.clients:
            return

        message_str = json.dumps(message)
        await asyncio.gather(*[
            websocket.send(message_str) 
            for websocket, _ in self.clients.values() 
            if websocket != exclude_websocket
        ])


async def main():
    server = CollaborationServer()

    print("Starting collaboration server...")
    async with serve(server.handle_client, "localhost", 8000):
        print("Collaboration server running on ws://localhost:8000")
        await asyncio.Future()  # run forever


if __name__ == "__main__":
    asyncio.run(main())