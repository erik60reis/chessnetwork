<script>
    function goToMainMenu() {
        window.location.href = "/";
    }
</script>
<style>
    .main {
        display: flex;
        flex-direction: row;
    }

    .sidebar {
        background-color: #262522;
        margin-left: 0;
        width: 8%;
        height: 97vh;
    }

    .logobannerdiv {
        width: 100%;
        height: 10vh;
    }

    .gameboardContainer {
        margin-left: 10%;
        margin-top: 10vh;
        width: 55%;
        max-width: 600px;
        max-height: 600px;
        height: auto;
        display: block;
        justify-content: center;
        align-items: center;
        background-color: #302e2b;
    }

    #gameboard {
        width: 100%;
        height: 100%;
        justify-content: center;
        align-items: center;
    }

    .rightsidebar {
        margin-left: 2%;
        margin-top: 2%;
        width: 20%;
        max-width: 20%;
        border: 2px solid #262522;
        height: 90vh;
        background-color: #262522;
    }

    .grid-container {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        grid-template-rows: repeat(4, 1fr);
        height: 44%;
    }

    .grid-item {
        background-color: #75716c;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
    }
    
    .game-options {
        text-align: left;
        justify-content: left;
    }

    select, #newroombutton, #roomid, #joinroombutton {
        padding: 4px 6px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-size: 16px;
        margin: 5px;
        background-color: #f9f9f9;
    }

    #joinroombutton {
        width: 100%;
    }

    h1, div {
        color: #f9f9f9;
    }

    @media (max-width: 768px) {
        .main {
            flex-direction: column;
        }

        .grid-container {
            margin-left: 10%;
            margin-right: 10%;
            height: 42vh;
        }

        .sidebar {
            width: 100%;
            margin-left: 0;
            background: none;
            height: 6vh;
        }

        .gameboardContainer {
            display: none;
        }

        .rightsidebar {
            margin-left: 0;
            width: 100%;
            max-width: 100%;
        }

        .logobannerdiv {
            width: 18%;
            height: 100%;
        }
    }
</style>
<div class="main">
    <div class="sidebar">
        <div class="logobannerdiv">
            <img src="/assets/logobanner.png" on:click={goToMainMenu} alt="Logo" style="width: 100%; height: 100%;">
        </div>
    </div>
    <div class="gameboardContainer">
        <div id="gameboard">
            
        </div>
    </div>
    <div class="rightsidebar">
        <div class="grid-container">
            <button class="grid-item">1+0</button>
            <button class="grid-item">2+1</button>
            <button class="grid-item">3+0</button>
            <button class="grid-item">3+2</button>
            <button class="grid-item">5+0</button>
            <button class="grid-item">5+3</button>
            <button class="grid-item">10+0</button>
            <button class="grid-item">10+5</button>
            <button class="grid-item">15+10</button>
            <button class="grid-item">30+0</button>
            <button class="grid-item">30+20</button>
        </div>
        <h1>Join Room:</h1>
        Code: <input type="text" id="roomid" name="roomid" placeholder="Room Code">
        <button id="joinroombutton">Join</button>
        <h1>Custom Options:</h1>
        <div class="game-options">
            Game: <select id="gametype">
                <option value="chess/chess">Chess</option>
                <option value="chess/courier">Courier Chess</option>
                <option value="chess/gothic">Gothic Chess</option>
                <option value="chess/racingkings">Racing Kings</option>
                <option value="chess/antichess">Antichess</option>
                <option value="chess/3check">3check Chess</option>
                <option value="chess/horde">Horde Chess</option>
                <option value="chess/amazon">Amazon Chess</option>
                <option value="chess/amazons">Amazons Chess</option>
                <option value="chess/crazyhouse">Crazyhouse Chess</option>
                <option value="chess2.0/chess2.0">Chesstraps Chess 2.0</option>
                <option value="checkers/checkers">Checkers</option>
                <option value="checkers/draughts">Draughts</option>
            </select>
            <br/>
            Time: 
            <select id="gametime" default="1800/0">
                <option value="15/0">0:15</option>
                <option value="60/0">1:00</option>
                <option value="180/0">3:00</option>
                <option value="300/0">5:00</option>
                <option value="300/3">5+3</option>
                <option value="600/0">10:00</option>
                <option value="600/5">10+5</option>
                <option value="900/0" selected>15:00</option>
                <option value="1800/0">30:00</option>
                <option value="3600/0">1:00:00</option>
                <option value="7200/0">2:00:00</option>
            </select>
            <br/>
            <button id="newroombutton">New Room</button>
            <br/>

            <div class="login-links">
                <a href="/add-discord-bot">Add Discord Bot</a>
                <!--a href="/login/discord/">Login</a-->&nbsp;
            </div>
            <br/>
        </div>
    </div>
    <script src="/assets/scripts/gameboard.js"></script>
    <script>
        let interval = setInterval(function () {
            if (createGameBoard !== undefined) {
                let gameBoard = document.getElementById("gameboard");
                let gameboardconfig = {
                    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
                    pieceTheme: "/assets/chesspieces/%piece%.png",
                }
                createGameBoard(gameBoard, gameboardconfig);

                document.getElementById("joinroombutton").onclick = () => {
                    window.location.href = "/" + document.getElementById('roomid').value;
                }


                document.getElementById('newroombutton').onclick = () => {
                    let gametypedropdownvalue = document.getElementById('gametype').options[document.getElementById('gametype').selectedIndex].value;
                    let gametimeropdownvalue = document.getElementById('gametime').options[document.getElementById('gametime').selectedIndex].value;
                    window.location.href = "/new/" + gametypedropdownvalue + "/" + gametimeropdownvalue;
                };

                

                clearInterval(interval);
            }
        }, 100);

        let gridItems = document.getElementsByClassName("grid-item");
        for (let index = 0; index < gridItems.length; index++) {
            const element = gridItems[index];
            element.addEventListener('click', () => {
                window.location.href = "/quickplay/" + (parseInt(element.innerHTML.split("+")[0]) * 60) + "/" + element.innerHTML.split("+")[1];
            })
        }
    </script>
</div>