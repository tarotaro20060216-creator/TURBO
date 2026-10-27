print("石取りゲーム開始")
print("21個の石が机に置かれている")
num = 21
while num != 1:
    pick = int(input("石をいくつ取りますか？（min:1/max:3）"))
    while pick < 1 or pick > 3:
        print("入力エラー：", pick, "は1～3の整数ではありません")
        pick = int(input("石をいくつ取りますか？（min:1/max:3）"))
    num = num - pick
    pcs = 4 - pick
    num = num - pcs
    print("プログラムが" + str(pcs) + "個の石を取りました、残り" + str(num) + "個の石が机に置かれている")
print("あなたの負けです")
