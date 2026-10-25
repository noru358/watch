# Art lab (견본 작업대)

게임 밖에서 그림체를 시험하는 곳. 그림은 `sprites.js`에 글자 격자로 적혀 있다(글자 하나 = 픽셀 하나, `.` = 투명, 색은 `PAL`). `lab.html`이 그걸 장면과 그림 모음으로 그리고 밤 조명(칸 단위로 끊기는 빛)과 한글 픽셀 폰트 간판(갈무리, OFL)을 얹는다.

다시 뽑기 (맥 터미널, 한 줄씩):

```
cd tools/artlab
python3 -m http.server 8765
```

다른 터미널 창에서 (저장소 폴더에서):

```
node tools/artlab/render.cjs docs/design/5-business/img
```

장면의 주인공은 주소 뒤 `?who=v4b`처럼 바꾸고, `&scale=3`을 붙이면 실제 게임 크기에 가깝게 나온다. 4차부터 주인공 시안은 `v4.js`(그림마다 자기 팔레트).

그림체가 확정되면 이 격자들을 게임의 `src/scenes/rift/draw/`로 옮긴다.
