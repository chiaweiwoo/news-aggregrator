import React, { useState } from 'react';
import {
  Drawer, DrawerBody, DrawerHeader, DrawerOverlay, DrawerContent,
  DrawerCloseButton, Box, Text, VStack, Flex, Spinner, Center, Divider,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Types ─────────────────────────────────────────────────────────────────────

interface Topic {
  title:    string;
  summary:  string;
  region:   'International' | 'Malaysia' | 'Singapore';
  theme?:   string;
  so_what?: string;
  lesson?:  string[];
}

interface SummaryRow {
  payload: { topics: Topic[] };
}

const REGIONS: { key: 'International' | 'Malaysia' | 'Singapore'; label: string; icon: string }[] = [
  { key: 'International', label: 'International', icon: '🌍' },
  { key: 'Singapore',     label: 'Singapore',     icon: '🇸🇬' },
  { key: 'Malaysia',      label: 'Malaysia',      icon: '🇲🇾' },
];

// ── Topic card ────────────────────────────────────────────────────────────────

function TopicCard({ topic }: { topic: Topic }) {
  const [expanded, setExpanded] = useState(false);
  const hasDetail = !!(topic.so_what || (topic.lesson && topic.lesson.length > 0));

  return (
    <Box py={3}>
      {/* Collapsed: theme label + title + summary */}
      {topic.theme && (
        <Text
          fontSize="2xs" fontWeight="700" color="brand.muted"
          textTransform="uppercase" letterSpacing="wider" mb={1}
        >
          {topic.theme}
        </Text>
      )}
      <Text
        fontSize="sm" fontWeight="700" color="brand.ink"
        lineHeight="1.4" mb={1}
        fontFamily="'Noto Serif SC', 'Georgia', serif"
      >
        {topic.title}
      </Text>
      <Text fontSize="xs" color="brand.muted" lineHeight="1.6" mb={hasDetail ? 2 : 0}>
        {topic.summary}
      </Text>

      {/* Expand / collapse trigger */}
      {hasDetail && (
        <Text
          as="button"
          fontSize="2xs"
          fontWeight="700"
          color="brand.red"
          letterSpacing="wide"
          cursor="pointer"
          onClick={() => setExpanded(v => !v)}
          _hover={{ opacity: 0.75 }}
        >
          {expanded ? 'CLOSE ▲' : 'READ ANALYSIS ▼'}
        </Text>
      )}

      {/* Expanded: so_what + lesson, visually separated */}
      {expanded && hasDetail && (
        <Box
          mt={3}
          pl={3}
          borderLeft="2px solid"
          borderColor="brand.red"
          bg="brand.card"
          borderRadius="sm"
          py={3}
          pr={3}
        >
          {topic.so_what && (
            <Box mb={topic.lesson && topic.lesson.length > 0 ? 3 : 0}>
              <Text
                fontSize="2xs" fontWeight="700" color="brand.red"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}
              >
                So what
              </Text>
              <Text fontSize="xs" color="brand.ink" lineHeight="1.8">
                {topic.so_what}
              </Text>
            </Box>
          )}

          {topic.lesson && topic.lesson.length > 0 && (
            <Box>
              <Text
                fontSize="2xs" fontWeight="700" color="brand.red"
                textTransform="uppercase" letterSpacing="wider" mb={1.5}
              >
                Why it matters
              </Text>
              <VStack spacing={2} align="stretch">
                {topic.lesson.map((point, i) => (
                  <Flex key={i} gap={2} align="flex-start">
                    <Text fontSize="xs" color="brand.muted" flexShrink={0} mt="2px">•</Text>
                    <Text fontSize="xs" color="brand.ink" lineHeight="1.8">{point}</Text>
                  </Flex>
                ))}
              </VStack>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

export default function ThisWeekDrawer({ isOpen, onClose }: Props) {
  const { data: summary, isLoading } = useQuery({
    queryKey: ['this-week'],
    queryFn: async (): Promise<SummaryRow | null> => {
      const { data } = await supabase
        .from('weekly_summary')
        .select('payload')
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      return (data as SummaryRow | null);
    },
    enabled: isOpen,
    staleTime: 0,
  });

  const allTopics = summary?.payload?.topics ?? [];

  return (
    <Drawer isOpen={isOpen} placement="bottom" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent
        maxH="80vh"
        style={{ maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}
        borderTopRadius="lg"
        bg="brand.paper"
      >
        <DrawerCloseButton color="brand.muted" mt={1} />

        <DrawerHeader borderBottom="1px solid" borderColor="brand.rule" pb={3} pt={4}>
          <Text
            fontSize="md" fontWeight="700" color="brand.ink" lineHeight="1.2"
            fontFamily="'Noto Serif SC', 'Georgia', serif"
          >
            This Week
          </Text>
          <Text fontSize="xs" color="brand.muted" fontWeight="400" mt={0.5}>
            The most important stories from the past 7 days.
          </Text>
        </DrawerHeader>

        <DrawerBody py={4} overflowY="auto">
          {isLoading ? (
            <Center py={10}>
              <Spinner color="brand.red" size="md" />
            </Center>
          ) : !allTopics.length ? (
            <Center py={10}>
              <VStack spacing={2}>
                <Text fontSize="2xl">📰</Text>
                <Text fontSize="sm" color="brand.ink" fontWeight="600">Coming soon…</Text>
                <Text fontSize="xs" color="brand.muted" textAlign="center" maxW="240px">
                  The summary appears after the daily job runs at 09:00 SGT.
                </Text>
              </VStack>
            </Center>
          ) : (
            <VStack spacing={5} align="stretch">
              {REGIONS.map(({ key, label, icon }) => {
                const topics = allTopics.filter(t => t.region === key);
                if (!topics.length) return null;
                return (
                  <Box key={key}>
                    <Text
                      fontSize="xs" fontWeight="700" color="brand.red"
                      textTransform="uppercase" letterSpacing="wider" mb={2}
                    >
                      {icon} {label}
                    </Text>
                    <VStack spacing={0} align="stretch">
                      {topics.map((topic, i) => (
                        <Box key={i}>
                          {i > 0 && <Divider borderColor="brand.rule" />}
                          <TopicCard topic={topic} />
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                );
              })}

              <Divider borderColor="brand.rule" />
              <Text fontSize="2xs" color="brand.muted" textAlign="center" pb={2} lineHeight="1.6">
                Updated daily · past 7 days
              </Text>
            </VStack>
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
