console.log("user1.js");
const auth = firebase.auth();
const db = firebase.firestore();
// const fStorage = firebase.storage();

let ALBUM_DATA = null;
let DOC_INDEX = null;
let U_REF = null;
let UDATA = null;
let VOTE_GIVEN = true;
const albumVoteHTML = document.querySelector("#album-vote");
albumVoteHTML.disabled = true;

const getUrl = async () => {
  let windowUrl = window.location.href;
  let quries = windowUrl.split("?");
  DOC_INDEX = quries[1].split("=")[1];
};

getUrl()
  .then(() => {
    return db.collection("miscellaneous").doc("allAlbums").get();
  })
  .then(async (albumSnap) => {
    let allAlbums = albumSnap.data().allAlbums;
    // let indexOf = allAlbums.map((el) => el.userDocId).indexOf(DOC_INDEX);
    ALBUM_DATA = allAlbums[DOC_INDEX];
    displayAlbumData();

    let context = null;
    await auth.onAuthStateChanged((user) => {
      if (!user) {
        // throw new Error("User is not loggedIn");
        throw "User is not loggedIn";
      } else {
        context = user;
      }
    });
    // console.log(context);
    if (context) {
      U_REF = db.collection("users").doc(context.uid);
      return U_REF.get();
    }
  })
  .then((userSnap) => {
    UDATA = userSnap.data();
    // console.log(UDATA);
    UDATA.uId = userSnap.id;
    // console.log(UDATA);

    let voteGivenIndex = UDATA.votes.indexOf(ALBUM_DATA.userDocId);
    if (voteGivenIndex >= 0) {
      VOTE_GIVEN = false;
    }
    albumVoteHTML.disabled = false;

    return;
  })
  .catch((error) => {
    let errorMessage = error.message;
    console.log(errorMessage);
    // display error message
  });

let albumPicHTML = document.querySelector("#album-pic");
let utubePlayerHTML = document.querySelector("#utube-player");
let albumNameHTML = document.querySelector("#album-name");
let ablumUsernameHTML = document.querySelector("#ablum-username");
let albumDescriptionHTML = document.querySelector("#album-description");
let albumSignHTML = document.querySelector("#album-sign");

const displayAlbumData = () => {
  // console.log(ALBUM_DATA);
  let imgPath = "../assets/images/common.png";
  if (ALBUM_DATA.img.url) {
    imgPath = ALBUM_DATA.img.url;
  }

  albumPicHTML.src = imgPath;
  utubePlayerHTML.src = `https://www.youtube.com/embed/${ALBUM_DATA.link.substring(
    17
  )}`;
  albumNameHTML.innerHTML = `Manchale[ ${ALBUM_DATA.name} Remix]`;
  let d = new Date(ALBUM_DATA.uploadedAt).toString();
  d = d.substring(0, 15);
  ablumUsernameHTML.innerHTML = `${ALBUM_DATA.userName} : ${d}`;
  albumDescriptionHTML.innerHTML = `<p>${ALBUM_DATA.description}</p>`;
  albumSignHTML.innerHTML = ALBUM_DATA.name;
};

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let ALL_COMMENTS = [];

db.collection("comments")
  .doc(DOC_INDEX)
  .onSnapshot((cSnap) => {
    if (cSnap.exists) {
      ALL_COMMENTS = cSnap.data().comments;
      displayComments();
    }
  });

let allCommentsHolderHTML = document.querySelector("#all-comments-holder");
let totalCommentsHTML = document.querySelector("#total-comments");

const displayComments = () => {
  let li = "";
  ALL_COMMENTS.map((c) => {
    let ddd = new Date(c.commentAt);
    ddd = ddd.toString();
    ddd = ddd.substring(0, 24);

    li += `
    <li class="list-group-item">
      <div class="row">
        <div class="col-xs-12 col-md-12" style="margin-left:-1% !important">
            <div class="col-lg-1 mic-info">
               ${c.byName} :
            </div>
            <div class="col-lg-6 comment-text" style="float:left !important" >${c.comment}</div>
            <div class="col-lg-2 mico" style="float:right; color: white">
             ${ddd}
            </div>
        </div>
      </div>
    </li>
    `;
  });

  allCommentsHolderHTML.innerHTML = li;
  totalCommentsHTML.innerHTML = ALL_COMMENTS.length
    ? ALL_COMMENTS.length
    : `No Comments Till Now.`;
};

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

let commentBoxHTML = document.querySelector("#comment-box");
let sendMessageButtonHTML = document.querySelector("#sendMessageButton");

const enterComment = (e) => {
  e.preventDefault();
  if (e.keyCode === 13) {
    // console.log(comment);
    if (commentBoxHTML.value) {
      if (UDATA) {
        submitComment();
      } else {
        // display redirect message
        window.location.href = `./../Auth/login.html`;
      }
    }
  }
};

commentBoxHTML.addEventListener("keyup", enterComment);

const clickComment = (e) => {
  e.preventDefault();
  if (commentBoxHTML.value) {
    if (UDATA) {
      submitComment();
    } else {
      // display redirect message
      window.location.href = `./../Auth/login.html`;
    }
  }
};

sendMessageButtonHTML.addEventListener("click", clickComment);

const submitComment = async () => {
  // console.log("submitComment");
  let cRef = db.collection("comments").doc(DOC_INDEX);
  let cData = {
    comment: commentBoxHTML.value,
    byId: UDATA.uId,
    byName: UDATA.name,
    commentAt: new Date().valueOf(),
  };
  await cRef
    .get()
    .then((cSnap) => {
      if (cSnap.exists) {
        let cSnapData = cSnap.data();
        cSnapData.comments.unshift(cData);
        cRef
          .update(cSnapData)
          .then(() => {
            commentBoxHTML.value = "";
            console.log("comment added");
          })
          .catch((error) => {
            let errorMessage = error.message;
            console.log(errorMessage);
            // display error message
          });
      } else {
        cRef
          .set({ comments: [cData] })
          .then(() => {
            commentBoxHTML.value = "";
            console.log("comment added");
          })
          .catch((error) => {
            let errorMessage = error.message;
            console.log(errorMessage);
            // display error message
          });
      }
    })
    .catch((error) => {
      let errorMessage = error.message;
      console.log(errorMessage);
      // display error message
    });
};

// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

const updateVoteClick = (e) => {
  if (albumVoteHTML.disabled) {
    return;
  }

  e.preventDefault();
  VOTE_GIVEN = !VOTE_GIVEN;

  albumVoteHTML.disabled = true;
  let allAlbumsRef = db.collection("miscellaneous").doc("allAlbums");

  allAlbumsRef
    .get()
    .then((allAlbumsSnaps) => {
      let allAlbumsData = allAlbumsSnaps.data();
      let allAlbumsArr = allAlbumsData.allAlbums;
      if (!VOTE_GIVEN) {
        allAlbumsArr[DOC_INDEX].votes++;
      } else {
        if (!(allAlbumsArr[DOC_INDEX].votes <= 0)) {
          allAlbumsArr[DOC_INDEX].votes--;
        } else {
          // user munpilating, error 401
        }
      }
      return allAlbumsRef.update(allAlbumsData);
    })
    .then(() => {
      if (!VOTE_GIVEN) {
        UDATA.votes.push(ALBUM_DATA.userDocId);
      } else {
        let vi = UDATA.votes.indexOf(ALBUM_DATA.userDocId);
        UDATA.votes.splice(vi, 1);
      }
      return U_REF.update(UDATA);
    })
    .then(() => {
      console.log("vote updated");
      albumVoteHTML.disabled = false;
      // success message
    })
    .catch((error) => {
      let errorMessage = error.message;
      console.log(errorMessage);
      // display error message
    });
};

albumVoteHTML.addEventListener("click", updateVoteClick);