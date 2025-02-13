from typing import Generic, TypeVar

from common.enums.response import ResponseStatusEnum
from fastapi.responses import JSONResponse

ResponseDataType = TypeVar("ResponseDataType")


class Response(JSONResponse, Generic[ResponseDataType]):
    def __init__(
        self,
        success: bool,
        status: ResponseStatusEnum,
        message: str,
        data: ResponseDataType = None,
    ) -> None:
        super().__init__(
            status_code=status.value,
            content={
                "success": success,
                "status": status.value,
                "message": message,
                "data": data,
            },
        )
