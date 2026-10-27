# 石取りゲーム
# 21個の石を2人で交互に1～3個ずつ取り、最後の石を取った方が負け。
# ユーザーが先手、プログラムが後手。
# プログラムは「ユーザーが取った数 + 自分が取る数 = 4（マジックナンバー）」となるように取るため、
# 21 = 4 × 5 + 1 より、最後の1個は必ずユーザーが取ることになる。

TOTAL_STONES = 21
MAGIC_NUMBER = 4
MIN_TAKE = 1
MAX_TAKE = 3


def ask_user_take(stones):
    """ユーザーに取る石の数を入力させる（1～3個、かつ残り個数以下）"""
    max_take = min(MAX_TAKE, stones)
    while True:
        text = input(f"何個取りますか？（{MIN_TAKE}～{max_take}）: ")
        if not text.strip().isdigit():
            print("数字を入力してください。")
            continue
        take = int(text)
        if MIN_TAKE <= take <= max_take:
            return take
        print(f"{MIN_TAKE}～{max_take}の範囲で入力してください。")


def main():
    stones = TOTAL_STONES
    print(f"石取りゲームを始めます。石は{stones}個あります。")
    print(f"交互に{MIN_TAKE}～{MAX_TAKE}個ずつ取り、最後の石を取った方が負けです。")
    print("あなたが先手です。")

    while True:
        # ユーザーの番
        print(f"\n残りの石: {stones}個  " + "●" * stones)
        user_take = ask_user_take(stones)
        stones -= user_take
        print(f"あなたは{user_take}個取りました。")
        if stones == 0:
            print("あなたが最後の石を取りました。あなたの負けです！")
            break

        # プログラムの番（ユーザーの取った数と合わせて4個になるように取る）
        program_take = MAGIC_NUMBER - user_take
        stones -= program_take
        print(f"プログラムは{program_take}個取りました。")
        if stones == 0:
            print("プログラムが最後の石を取りました。あなたの勝ちです！")
            break


if __name__ == "__main__":
    main()
