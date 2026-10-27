print("数あてゲーム開始！")
score = 0
for i in range(5):
    n = float(input("予想値を入力してください："))
    if n % 1 != 0 or n <= 0:
        print("正整数を入力してください")
        continue
    if n == 72:
        score = 100 - i * 20
        print("正解です！")
        break
    elif n <= 62:
        print("もっと大きい!")
    elif n < 72:
        print("おしい！もうちょっと大きい！")
    elif n < 82:
        print("おしい！もうちょっと小さい！")
    else:
        print("もっと小さい!")
if score == 0:
    print("残念！正解は72でした")
print("点数：", score, "点")
