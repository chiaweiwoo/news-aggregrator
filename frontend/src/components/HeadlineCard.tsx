import React, { useState } from 'react';
import { Box, HStack, Image, Spinner, Text, Link } from '@chakra-ui/react';
import { CHANNEL_META, DEFAULT_CHANNEL_COLOR } from '../config/sources';
import { useSpeech } from '../contexts/SpeechContext';
import { useFontSize, FONT_SIZE_MAP } from '../contexts/FontSizeContext';
import { useWordDefinition } from '../hooks/useWordDefinition';
import WordSheet from './WordSheet';

// Noto Serif SC for Chinese editorial headlines — Bilingual Editorial Asia design
const ZH_SERIF = `'Noto Serif SC', 'Songti SC', 'STSong', 'SimSun', Georgia, serif`;

function IconSpeaker() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden>
      <path d="M1.5 4.5h2.25L7 1.5v10l-3.25-3H1.5v-4z" />
      <path d="M9 3.5a4 4 0 0 1 0 6" stroke="currentColor" strokeWidth="1.2"
        strokeLinecap="round" fill="none" />
      <path d="M10.5 1.5a6.5 6.5 0 0 1 0 10" stroke="currentColor" strokeWidth="1.2"
        strokeLinecap="round" fill="none" />
    </svg>
  );
}

function IconStop() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor" aria-hidden>
      <rect x="2.5" y="2.5" width="8" height="8" rx="1.5" />
    </svg>
  );
}

function IconShare() {
  return (
    <svg width="13" height="13" viewBox="0 0 14 14" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M7 1v9" />
      <path d="M4 4l3-3 3 3" />
      <path d="M2 9v3.5h10V9" />
    </svg>
  );
}

// Build and share a card image for the given headline.
// Creates a temporary off-screen div, captures it with html2canvas,
// then uses the Web Share API (mobile) or falls back to download.
async function shareHeadline(headline: any) {
  const html2canvas = (await import('html2canvas')).default;
  await document.fonts.ready;

  const card = document.createElement('div');
  card.style.cssText = [
    'position:fixed', 'left:-9999px', 'top:0',
    'width:600px', 'height:315px',
    'background:#1C1814',
    'font-family:"Noto Serif SC","Inter",-apple-system,sans-serif',
    'box-sizing:border-box',
    'overflow:hidden',
  ].join(';');

  // Red accent bar
  const bar = document.createElement('div');
  bar.style.cssText = 'position:absolute;top:0;left:0;right:0;height:5px;background:#c8102e';
  card.appendChild(bar);

  // Inner content padding
  const inner = document.createElement('div');
  inner.style.cssText = 'position:absolute;top:30px;left:40px;right:40px;bottom:50px';

  // Chinese headline
  const zh = document.createElement('div');
  zh.style.cssText = [
    'color:#F0EBE0', 'font-size:26px', 'font-weight:700', 'line-height:1.45',
    'max-height:76px', 'overflow:hidden',
    `font-family:'Noto Serif SC',serif`,
  ].join(';');
  zh.innerText = headline.title_zh;
  inner.appendChild(zh);

  // English translation
  if (headline.title_en) {
    const en = document.createElement('div');
    en.style.cssText = [
      'color:#7A7570', 'font-size:15px', 'line-height:1.5',
      'margin-top:10px', 'max-height:45px', 'overflow:hidden',
      'font-family:Inter,sans-serif',
    ].join(';');
    en.innerText = headline.title_en;
    inner.appendChild(en);
  }

  card.appendChild(inner);

  // Footer: source+date on left, NewsLingo on right
  const date = new Date(headline.published_at).toLocaleDateString('en-MY', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const footer = document.createElement('div');
  footer.style.cssText = [
    'position:absolute', 'bottom:20px', 'left:40px', 'right:40px',
    'display:flex', 'justify-content:space-between', 'align-items:center',
    'font-family:Inter,sans-serif', 'font-size:12px', 'color:#5A5550',
  ].join(';');
  footer.innerHTML = `<span>${headline.channel} · ${date}</span><span style="color:#c8102e;font-weight:700;font-family:'Noto Serif SC',serif;letter-spacing:-0.3px">NewsLingo</span>`;
  card.appendChild(footer);

  document.body.appendChild(card);

  try {
    const canvas = await html2canvas(card, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#1C1814',
    });

    const blob = await new Promise<Blob>(resolve =>
      canvas.toBlob(b => resolve(b!), 'image/png')
    );

    const file = new File([blob], 'newslingo.png', { type: 'image/png' });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file], title: headline.title_zh });
    } else {
      // Desktop fallback — download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'newslingo.png';
      a.click();
      URL.revokeObjectURL(url);
    }
  } finally {
    document.body.removeChild(card);
  }
}

export default function HeadlineCard({ headline }: { headline: any }) {
  const articleUrl = headline.source_url || `https://www.youtube.com/watch?v=${headline.id}`;
  const d = new Date(headline.published_at);
  const dateStr = d.toLocaleDateString('en-MY', { day: 'numeric', month: 'short' });
  const timeStr = d.toLocaleTimeString('en-MY', { hour: 'numeric', minute: '2-digit', hour12: true });

  const { playingId, speak }                                     = useSpeech();
  const { fontSize }                                             = useFontSize();
  const { definition, loading, activeWord, lookup, dismiss }     = useWordDefinition();
  const [isSharing, setIsSharing]                                = useState(false);

  const isPlaying    = playingId === headline.id;
  const channelColor = CHANNEL_META[headline.channel]?.color ?? DEFAULT_CHANNEL_COLOR;
  const sizes        = FONT_SIZE_MAP[fontSize];

  const handleShare = async () => {
    if (isSharing) return;
    setIsSharing(true);
    try { await shareHeadline(headline); }
    finally { setIsSharing(false); }
  };

  // Split English title into tokens preserving whitespace between words
  const tokens = headline.title_en ? headline.title_en.split(/(\s+)/) : [];

  return (
    <>
      <HStack
        align="start"
        spacing={3}
        p={3}
        bg="brand.card"
        borderRadius="sm"
        boxShadow="xs"
        _hover={{ boxShadow: 'sm' }}
        transition="box-shadow 0.15s"
      >
        {/* Thumbnail */}
        <Link href={articleUrl} isExternal flexShrink={0}>
          <Image
            src={headline.thumbnail_url}
            alt={headline.title_zh}
            borderRadius="sm"
            w="90px"
            h="51px"
            objectFit="cover"
            bg="brand.rule"
          />
        </Link>

        {/* Text block */}
        <Box flex={1} minW={0}>

          {/* Chinese headline — serif, dominant */}
          <Link href={articleUrl} isExternal _hover={{ textDecoration: 'none' }}>
            <Text
              fontFamily={ZH_SERIF}
              fontSize={sizes.zh}
              fontWeight="700"
              lineHeight="1.4"
              color="brand.ink"
              _hover={{ color: 'brand.red' }}
              transition="color 0.1s"
            >
              {headline.title_zh}
            </Text>
          </Link>

          {/* English translation — tappable words + share + speaker */}
          {headline.title_en && (
            <HStack mt={1} spacing={1.5} align="flex-start">
              {/* Inline tappable word tokens */}
              <Box
                fontFamily="'Inter', sans-serif"
                fontSize={sizes.en}
                fontWeight="400"
                color="brand.muted"
                lineHeight="1.5"
                flex={1}
              >
                {tokens.map((token: string, i: number) => {
                  if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;

                  const clean = token.replace(/[^a-zA-Z'-]/g, '').toLowerCase();
                  const isActive = clean === activeWord;

                  return (
                    <Box
                      key={i}
                      as="span"
                      cursor={clean.length >= 2 ? 'pointer' : 'text'}
                      onClick={() => clean.length >= 2 && lookup(token)}
                      borderBottom={isActive ? '1px solid' : 'none'}
                      borderColor="brand.red"
                      color={isActive ? 'brand.ink' : 'inherit'}
                      _hover={clean.length >= 2 ? { color: 'brand.ink' } : {}}
                      transition="color 0.1s"
                      userSelect="none"
                    >
                      {token}
                    </Box>
                  );
                })}
              </Box>

              {/* Share button */}
              <Box
                as="button"
                onClick={handleShare}
                flexShrink={0}
                mt="2px"
                color="brand.rule"
                _hover={{ color: 'brand.muted' }}
                transition="color 0.15s"
                aria-label="Share"
                title="Share"
                lineHeight="1"
              >
                {isSharing ? <Spinner size="xs" color="brand.muted" /> : <IconShare />}
              </Box>

              {/* Read-aloud button */}
              <Box
                as="button"
                onClick={() => speak(headline.id, headline.title_en)}
                flexShrink={0}
                mt="2px"
                color={isPlaying ? 'brand.red' : 'brand.rule'}
                _hover={{ color: isPlaying ? '#c0392b' : 'brand.muted' }}
                transition="color 0.15s"
                aria-label={isPlaying ? 'Stop' : 'Read aloud'}
                title={isPlaying ? 'Stop' : 'Read aloud'}
                lineHeight="1"
              >
                {isPlaying ? <IconStop /> : <IconSpeaker />}
              </Box>
            </HStack>
          )}

          {/* Meta line — source · date · time */}
          <HStack mt={1.5} spacing={1} fontSize="2xs" color="brand.muted" letterSpacing="0.02em">
            <Text fontWeight="600" color={channelColor}>{headline.channel}</Text>
            <Text color="brand.rule">·</Text>
            <Text>{dateStr}</Text>
            <Text color="brand.rule">·</Text>
            <Text>{timeStr}</Text>
          </HStack>
        </Box>
      </HStack>

      {/* Word definition sheet — shown when a word is tapped */}
      {activeWord && (
        <WordSheet
          word={activeWord}
          definition={definition}
          loading={loading}
          onSpeak={speak}
          onDismiss={dismiss}
        />
      )}
    </>
  );
}
