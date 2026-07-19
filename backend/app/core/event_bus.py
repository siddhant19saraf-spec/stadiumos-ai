import asyncio
import json
import logging
from typing import Any, Callable, Coroutine, Optional

logger = logging.getLogger(__name__)

EventHandler = Callable[[dict[str, Any]], Coroutine[Any, Any, None]]


class EventBus:
    def __init__(self) -> None:
        self._subscribers: dict[str, list[EventHandler]] = {}
        self._queue: asyncio.Queue[tuple[str, dict[str, Any]]] = asyncio.Queue()
        self._running = False
        self._task: Optional[asyncio.Task[None]] = None

    def subscribe(self, event_type: str, handler: EventHandler) -> None:
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        self._subscribers[event_type].append(handler)
        logger.debug(f"Subscribed handler to event: {event_type}")

    def unsubscribe(self, event_type: str, handler: EventHandler) -> None:
        if event_type in self._subscribers:
            self._subscribers[event_type] = [
                h for h in self._subscribers[event_type] if h is not handler
            ]
            if not self._subscribers[event_type]:
                del self._subscribers[event_type]

    async def publish(self, event_type: str, data: dict[str, Any]) -> None:
        await self._queue.put((event_type, data))
        logger.debug(f"Published event: {event_type}")

    async def _process_events(self) -> None:
        while self._running:
            try:
                event_type, data = await asyncio.wait_for(
                    self._queue.get(), timeout=1.0
                )
                handlers = self._subscribers.get(event_type, [])
                results = await asyncio.gather(
                    *[handler(data) for handler in handlers],
                    return_exceptions=True,
                )
                for result in results:
                    if isinstance(result, Exception):
                        logger.error(
                            f"Event handler failed for {event_type}: {result}"
                        )
                self._queue.task_done()
            except asyncio.TimeoutError:
                continue
            except Exception as e:
                logger.error(f"Event bus error: {e}")

    def start(self) -> None:
        if not self._running:
            self._running = True
            self._task = asyncio.create_task(self._process_events())
            logger.info("Event bus started")

    async def stop(self) -> None:
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
        logger.info("Event bus stopped")


event_bus = EventBus()
