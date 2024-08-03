
    document.addEventListener('DOMContentLoaded', () => {

        const socket = io('http://localhost:3000');


        // DOM Elements
        // const inputBlock = document.querySelector('.containerinput1');
        const playonlinebtn = document.querySelector('#playonline');
        const mainpage = document.querySelector('.landingpage'); //landing page
        const page2 = document.querySelector('.playwithfriendspage');//play with friends page
        const loadingpage = document.querySelector('#loadingpage');
        const bingopage =document.querySelector('.bingopage');
        // const logincontainer = document.querySelector('.logincontainer');//not present
        const waiting = document.querySelector('.waitingpage');
        const results = document.querySelector('.resultspage');
        const windiv = document.querySelector('.winner');
        const loserdiv = document.querySelector('.loser');
        const creditspage = document.querySelector('.creditspage')
        

        const bingoUsername = document.querySelector('#yourname');
        const childBoard = document.createElement('div');
        let currentPlayerText = document.querySelector('#whoplays');
        const resetbtn = document.querySelector('.reset');
        const bingoBtn = document.querySelector('.bingo');
        const flag = document.querySelector('.flag');
        let opponent = document.querySelector('#oponentname');
        // let roomNumber = document.querySelector('.roomnumber');
        let logspara = document.querySelector('#logs')
        

        let name;
        let windeclared =0;
        let roomid;
        let currentplayer;
        let opponentname;
        let totalClicked = [];
        let gamestatus;
        let maindiv;
        console.log(creditspage);
        creditspage.style.display='none';
        console.log(creditspage);
        loadingpage.style.display = 'none';
        bingopage.style.display='none';
        page2.style.display = 'none';
        waiting.style.display = 'none';
        results.style.display = 'none';
        windiv.style.display = 'none';
        loserdiv.style.display = 'none';
        

        //lets go
        playonlinebtn.addEventListener('click', () => {
            mainpage.style.display = 'none';
            page2.style.display = 'flex';
            // logincontainer.style.display = 'flex';
        });


        //join
        const joinBtn = document.querySelector('#join');
        joinBtn.addEventListener('click', function () {
            const nameinput = document.querySelector('#nameinput');
            let name = nameinput.value;
            if (name === '' || name === null) {
                alert('Name can\'t be empty');
            } else {
                console.log(`your name is ${name}`);
                nameinput.readOnly = true;
                console.log('its the username?')
                bingoUsername.innerHTML = name;
                console.log('no its not the username?')
                // logincontainer.style.display = 'none';
                page2.style.display ="none"
                waiting.style.display = 'flex';
                console.log('ok')
                socket.emit('nameofplayer', name);
                console.log('ok??')
            }
        });



        //room found
        socket.on('room-found-status', (data) => {
            const name = bingoUsername.innerText;
            const bingoCardsMain = document.querySelector('.bingocard');
            maindiv = bingoCardsMain;
            roomid = data.roomNumber;
        
            waiting.style.display = 'none';
            
            loadingpage.style.display = 'flex';
            console.log("page is loading");
        
            setTimeout(() => {
                loadingpage.style.display = 'none';
                
                let randomNumbersArr = generateRandomNumbers();
                generateBingo(name, randomNumbersArr, bingoCardsMain);
        
                bingopage.style.display = 'flex';
            }, 3000);
        });
        


        //current player from server
        socket.on('current-player', (data) => {
            currentplayer = data;
            currentPlayerText.innerHTML = `${currentplayer} is making the move...`;
        });


        // oponent
        socket.on('opponent-assigned', (data) => {
            opponentname = data.opponentName;
            opponent.innerHTML = opponentname
            console.log(`Your opponent: ${opponentname}`);
        });


        //random numbers
        function generateRandomNumbers() {
            let arr = Array.from({ length: 25 }, (_, i) => i + 1);
            for (let i = arr.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        }


        //get one random number at a time
        function placeRandomNumber(randomNumbers, box) {
            let randomNumber = randomNumbers.pop();
            
            box.classList.add(`number-${randomNumber}`);
            return randomNumber;
        }


        // Generate Bingo card
        function generateBingo(playername, randomNumbers, maindiv) {
            const bingoCardsDiv = document.createElement('div');
            bingoCardsDiv.classList.add('bingoscriptdiv');
            for (let i = 0; i < 5; i++) {
                const row = document.createElement('div');
                row.classList.add('bingorow');
                for (let j = 0; j < 5; j++) {
                    const box = document.createElement('div');
                    box.classList.add(`box-${i}-${j}-${playername}`, `boxplayer-${playername}`, 'bingobox');
                    box.addEventListener('click', () => makeMove(i, j, playername));
                    box.textContent = placeRandomNumber(randomNumbers, box);
                    row.append(box);
                }
                bingoCardsDiv.append(row);
            }
            maindiv.append(bingoCardsDiv);
        }


        resetbtn.addEventListener('click',()=>{
            reset()
        })


        //move by player , and sending to the server 
        function makeMove(i, j, playername) {
            if (currentplayer === playername) {
                const boxClicked = document.querySelector(`.box-${i}-${j}-${playername}`);
                const numberClass = boxClicked.classList[3];
                if (!totalClicked.includes(numberClass)){
                    boxClicked.classList.add('checked');

                    totalClicked.push(numberClass)
                    console.log(numberClass);
                    checkwin(playername);
                    socket.emit('move', {
                        room: roomid,
                        move: numberClass,
                        game:true,
                    });


                } 
                else{
                    currentPlayerText.innerHTML =`select a number ,which is not selected before`;
                    return makeMove(i,j,playername);
                }
            }
            else {
                alert('It\'s not your turn');
            }
        }


        //data of move recieved from the server
        socket.on('move-made', (data) => { 
        
            let move = data.move;
            gamestatus = data.gamestatus;
            const box = document.querySelector(`.${move}`);
            totalClicked.push(move);
            if (box) {
                box.classList.add('checked');
            } else {
                console.error(`Box with ${move} not found.`);
            }
        });


        //check win conditions
        function checkwin(playername){

            completedset = 0;
            bingo = false;
            for(let i=0;i<5;i++){
                if(checkrow(i,playername)){
                    completedset = completedset + 1;
                }
            }
            for(let i=0;i<5;i++){
                if(checkcol(i,playername)){
                    completedset = completedset + 1;
                }
            }
            if(checkdiagonal1(playername)){
                completedset = completedset + 1;
            }
            if(checkdiagonal2(playername)){
                completedset = completedset + 1;
            }
            if(completedset >=5){
                bingoBtn.classList.add('bingoactivated')

            }
            if( completedset >= 5){
                bingoBtn.addEventListener('click',()=>{
                    socket.emit('winstatus',
                        {
                            room : roomid,
                            playername : playername,
                            game: false,
                        }
                    )
                    bingo = true;
                })
            }
            return bingo
        }


        //Row condition
        function checkrow(row,playername){
            for(let col = 0; col<5 ; col++){
                if(!document.querySelector(`.box-${row}-${col}-${playername}`).classList.contains('checked')){
                    return false;
                }
            }
            
            return true;
            
        }


        //col condition
        function checkcol(col,playername){
            for(let row = 0; row<5 ; row++){
                if(!document.querySelector(`.box-${row}-${col}-${playername}`).classList.contains('checked')){
                    return false;
                }
            }
            return true;
        }


        //diagonal condition left to right
        function checkdiagonal1(playername){
            for(let i = 0; i<5;i++){
                if(!document.querySelector(`.box-${i}-${i}-${playername}`).classList.contains('checked')){
                    return false;
                }
            }
            return true;
        }


        //diagonal condition right to left
        function checkdiagonal2(playername){
            for(let i = 0; i<5;i++){
                if(!document.querySelector(`.box-${i}-${4-i}-${playername}`).classList.contains('checked')){
                    return false;
                }
            }
            return true;
        }


        //winner/loser annocement
        socket.on('winner',(data)=>{
            const playerwon = data.player;
            const you = bingoUsername.innerText;
            console.log(`player won ${playerwon}`)
            windeclared = 1;
                gamestatus = data.gamestatus;
            if(you == playerwon){
                bingopage.style.display = 'none';
                results.style.display = "flex";
                windiv.style.display = "flex";
                logspara.innerHTML = `logs : ${data.logs}`
                
            }
            else{
                
                bingopage.style.display = 'none';
                results.style.display = "flex";
                loserdiv.style.display = "flex";
                logspara.innerHTML = 'logs : umm skill issue?'
                
            }
        })


        // function to reset the bingo board
        function reset(){
            if (gamestatus!=true){
                const name = bingoUsername.innerText;
                maindiv.innerHTML = '';
                let randomNumbersArr = generateRandomNumbers();
                generateBingo(name, randomNumbersArr, maindiv);
            }
            else{
                currentPlayerText.innerText=`can't reset while, game started`
            }
        }


    //flag function

    flag.addEventListener('click',()=>{
        const name = bingoUsername.innerText;
        flagfunction(name);
    })

    // function for flag and exit
        function flagfunction(name){
            console.log(opponentname)
            let opname =opponent.innerText;
            windeclared=1;
                socket.emit('flag',{
                    room : roomid,
                    playername : name,
                    oponentname : opname,
                    gamestatus : gamestatus,
                });
            
        }


        socket.on('disconnectedplayer',(data)=>{
            const playerdisconnected = data.player;
            const oponentname = opponent.innerText;        
            console.log(playerdisconnected);
            if(windeclared==0){
                if(oponentname == playerdisconnected){
                    bingopage.style.display = 'none';
                    results.style.display = "flex";
                    windiv.style.display = "flex";
                    logspara.innerHTML = `logs : ${data.logs}`
                    windeclared =1;
                }
            }
        
        })
      

        



        const creditsbtn = document.querySelector('#credits')
        const homepagebtn = document.querySelector('#homepage')
        const playagainbtn = document.querySelector('#playagainwin')
        const creditsbtn2 = document.querySelector('#creditswin')
        const playagainbtn2 =document.querySelector('#playagainlose')
        const creditsbtn3 = document.querySelector("#creditslose");

        creditsbtn.addEventListener('click',()=>{
            mainpage.style.display = 'none';
            creditspage.style.display ='flex';
        })

        homepagebtn.addEventListener('click',()=>{
            location.reload();
        })

       playagainbtn.addEventListener('click',()=>{
            location.reload();
       })

       playagainbtn2.addEventListener('click',()=>{
            location.reload();
       })

        creditsbtn2.addEventListener('click',()=>{
            results.style.display = 'none';
            creditspage.style.display = 'flex';
        });
        
        creditsbtn3.addEventListener('click',()=>{
            results.style.display = 'none';
            creditspage.style.display = 'flex';
        });
    });