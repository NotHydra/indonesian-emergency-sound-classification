interface Response<DataType = null> {
    success: boolean;
    statusCode: number;
    message: string;
    data: DataType;
}
