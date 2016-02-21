module TemplateParser (parse) where

import Generator exposing (..)
import Blueshift exposing (..)
import Blueshift.Infix exposing (..)
import String

inCurlyBraces : Parser a -> Parser a
inCurlyBraces p =
  char '{' `annotate` "a '{'"
  >>= \_ -> p
  >>= \r -> char '}' `annotate` "a '}'"
  >>> (succeed r)

partOfSpeech : Parser PartOfSpeech
partOfSpeech =
  (string "noun" >>> (succeed Noun))
  <|> (string "adj" >>> (succeed Adjective))
  <|> (string "verb" >>> (succeed Verb))
  <|> (string "adv" >>> (succeed Adverb))
  `annotate` "a part of speech"

word : Parser TemplatePart
word = Word `map` (inCurlyBraces partOfSpeech)

number : Parser TemplatePart
number = (always Number) `map` (string "\\d")

verbatimString : Parser TemplatePart
verbatimString =
  (List.map String.fromChar >> String.concat >> Verbatim)
  <$> some (notChar '{')

templatePart : Parser TemplatePart
templatePart =
  word
  <|> number
  <|> verbatimString

template : Parser Template
template =
  many templatePart
  >>= \r -> end
  >>= \_ -> succeed r

parse = Blueshift.parse template
