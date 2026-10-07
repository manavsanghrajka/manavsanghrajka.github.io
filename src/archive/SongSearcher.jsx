import { useState, useEffect, useRef } from 'react';

const spotifyClientId = import.meta.env.VITE_CLIENT_ID;
const spotifyClientSecret = import.meta.env.VITE_CLIENT_SECRET;
const lastfmApiKey = import.meta.env.VITE_LASTFM_API_KEY;

const SongSearcher = () => {
  const [searchInput, setSearchInput] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [similarTracks, setSimilarTracks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchedTrack, setSearchedTrack] = useState(null);
  
  const audioRef = useRef(null);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    if (!spotifyClientId || !spotifyClientSecret) return;

    let authParams = {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body:
        "grant_type=client_credentials&client_id=" +
        spotifyClientId +
        "&client_secret=" +
        spotifyClientSecret,
    };
    
    fetch("https://accounts.spotify.com/api/token", authParams)
      .then((result) => result.json())
      .then((data) => {
        setAccessToken(data.access_token);
      })
      .catch((err) => {
          console.error("Auth error:", err);
      });
  }, []);

  async function handleSearchClick() {
    if (!searchInput) return;
    setLoading(true);
    setError(null);
    setSimilarTracks([]);
    setSearchResults([]);
    setSearchedTrack(null);
    setPlayingId(null);
    if (audioRef.current) audioRef.current.pause();

    try {
      const fmSearchRes = await fetch(`https://ws.audioscrobbler.com/2.0/?method=track.search&track=${encodeURIComponent(searchInput)}&api_key=${lastfmApiKey}&format=json&limit=10`);
      const fmSearchData = await fmSearchRes.json();
      
      const tracks = fmSearchData.results?.trackmatches?.track;
      if (!tracks || tracks.length === 0) {
         setError("Track not found on Last.fm.");
      } else {
         setSearchResults(tracks);
      }
    } catch (err) {
      setError("An error occurred while searching for the track.");
      console.error(err);
    }
    setLoading(false);
  }

  async function handleSelectTrack(track) {
      setSearchResults([]);
      setLoading(true);
      setError(null);
      setSearchedTrack(`${track.name} by ${track.artist}`);

      try {
        const similarRes = await fetch(`https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=${encodeURIComponent(track.artist)}&track=${encodeURIComponent(track.name)}&api_key=${lastfmApiKey}&format=json&limit=12`);
        const similarData = await similarRes.json();
        
        if (!similarData.similartracks?.track?.length) {
           setError("No similar tracks found for this song.");
           setLoading(false);
           return;
        }

        const tracksToLookUp = similarData.similartracks.track;
        const spotifyParams = {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + accessToken,
          },
        };

        const enrichedTracks = await Promise.all(
          tracksToLookUp.map(async (t) => {
             const sq = `track:${t.name} artist:${t.artist.name}`;
             try {
               const spRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(sq)}&type=track&limit=1`, spotifyParams);
               const spData = await spRes.json();
               const spTrack = spData.tracks?.items?.[0];
               
               if (spTrack) {
                  return {
                     id: spTrack.id,
                     name: spTrack.name,
                     artist: spTrack.artists[0]?.name,
                     image: spTrack.album?.images?.[0]?.url,
                     spotify_url: spTrack.external_urls?.spotify,
                     preview_url: spTrack.preview_url
                  };
               }
             } catch(e) {
               console.error("Spotify lookup failed for", t.name, e);
             }
             return {
                 id: t.mbid || t.name,
                 name: t.name,
                 artist: t.artist.name,
                 image: t.image?.[3]?.["#text"] || "https://via.placeholder.com/300?text=No+Cover",
                 spotify_url: t.url,
                 preview_url: null
             };
          })
        );

        setSimilarTracks(enrichedTracks.filter(Boolean));

      } catch (err) {
        setError("An error occurred while finding songs.");
        console.error(err);
      }
      setLoading(false);
  }

  const togglePlay = (url, id) => {
    if (playingId === id) {
      audioRef.current.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
        setPlayingId(id);
      }
    }
  };

  return (
    <main className="flex-grow flex flex-col items-center justify-start py-16 px-6 relative w-full">
      <h1 className="text-2xl md:text-3xl font-bold text-ink uppercase tracking-terminal mb-4 text-center">
        [ SONG SEARCHER ]
      </h1>
      <p className="text-sm text-ink/70 mb-8 uppercase tracking-terminal text-center">Find similar songs instantly</p>

      {(!spotifyClientId || !spotifyClientSecret || !lastfmApiKey) ? (
        <div className="bg-highlight text-invert border border-structure p-4 max-w-md w-full mb-8 text-center text-sm font-mono tracking-terminal">
            [ WARNING: MISSING API KEYS ]<br/><br/>
            Please add <b>VITE_LASTFM_API_KEY</b> along with your Spotify keys to your .env file to use this app.
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row w-full max-w-2xl mb-8 gap-4">
        <input
          placeholder="Search for a song (e.g. 'Blinding Lights')..."
          type="text"
          value={searchInput}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSearchClick();
          }}
          onChange={(event) => setSearchInput(event.target.value)}
          className="flex-grow bg-canvas outline-none border border-structure p-3 text-ink focus:border-ink transition-colors font-mono uppercase tracking-terminal placeholder:text-ink/30"
        />
        <button 
          onClick={handleSearchClick}
          disabled={loading || !accessToken || !lastfmApiKey}
          className="bg-ink text-invert border border-ink hover:bg-invert hover:text-ink transition-colors font-bold uppercase tracking-terminal px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "SEARCHING..." : "SEARCH"}
        </button>
      </div>

      {error && (
        <div className="text-highlight font-bold mb-8 uppercase tracking-terminal">
            [ ERROR: {error} ]
        </div>
      )}

      {/* Select Track UI */}
      {searchResults.length > 0 && (
         <div className="mb-8 w-full max-w-3xl flex flex-col gap-4">
             <h2 className="text-center font-bold text-ink uppercase tracking-terminal mb-2 border-b border-structure pb-2">
                 Choose the correct track:
             </h2>
             {searchResults.map((track, i) => (
                <button
                   key={i}
                   onClick={() => handleSelectTrack(track)}
                   className="group flex items-center justify-between border border-structure p-4 hover:border-ink hover:bg-ink hover:text-invert transition-colors"
                >
                    <div className="flex flex-col items-start">
                       <span className="font-bold text-lg leading-none mb-1 uppercase tracking-terminal">{track.name}</span>
                       <span className="text-sm opacity-70 uppercase tracking-terminal">{track.artist}</span>
                    </div>
                    <span className="text-sm font-semibold opacity-0 group-hover:opacity-100 uppercase tracking-terminal">
                       [ SELECT ]
                    </span>
                </button>
             ))}
         </div>
      )}

      {searchedTrack && !loading && searchResults.length === 0 && (
         <div className="mb-8 border border-structure p-4 w-full max-w-3xl text-center uppercase tracking-terminal text-ink">
            Showing similar songs for:<br/>
            <span className="font-bold text-lg mt-2 inline-block">~ {searchedTrack} ~</span>
         </div>
      )}

      {/* Similar Vibes UI */}
      {similarTracks.length > 0 && searchResults.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-7xl">
            {similarTracks.map((track) => {
            return (
                <div
                key={track.id}
                className="group border border-structure bg-canvas p-6 flex flex-col hover:border-ink transition-none"
                >
                <div className="relative mb-6">
                    <img
                    src={track.image}
                    alt={track.name}
                    className="w-full aspect-square object-cover opacity-80 group-hover:opacity-100 transition-opacity grayscale group-hover:grayscale-0"
                    />
                    {track.preview_url && (
                        <button 
                        onClick={() => togglePlay(track.preview_url, track.id)}
                        className="absolute inset-0 m-auto w-12 h-12 bg-ink/80 text-invert border border-invert font-bold rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        >
                        {playingId === track.id ? "||" : "▶"}
                        </button>
                    )}
                </div>
                <h3 className="font-bold uppercase tracking-terminal text-ink text-center mb-1 line-clamp-1 text-lg">
                    {track.name}
                </h3>
                <p className="text-xs text-ink/70 text-center mb-6 uppercase tracking-terminal line-clamp-1">
                    {track.artist}
                </p>
                <a
                    href={track.spotify_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto w-full border border-ink text-ink py-3 uppercase text-xs font-semibold hover:bg-ink hover:text-invert text-center tracking-terminal transition-colors"
                    title="View on Spotify"
                >
                    [ VIEW ON SPOTIFY ]
                </a>
                </div>
            );
            })}
        </div>
      )}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
    </main>
  );
};

export default SongSearcher;
