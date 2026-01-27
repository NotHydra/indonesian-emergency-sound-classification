from enum import Enum


class ResponseStatusEnum(Enum):
    OK_200 = 200
    CREATED_201 = 201
    BAD_REQUEST_400 = 400
    INTERNAL_SERVER_ERROR_500 = 500
