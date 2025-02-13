import datetime


class Logger:
    def debug(text: str) -> None:
        print(
            f"\033[36mDEBUG\033[0m:    [{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]{text}"
        )

    def error(text: str) -> None:
        print(
            f"\033[31mERROR\033[0m:    [{datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}]{text}"
        )
