import { spacingIncrement } from 'prepo-ui'
import styled from 'styled-components'
import PositionSlideUp from './PositionSlideUp'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacingIncrement(16)};
  min-height: 340px; // TODO: will be removed
  padding: ${spacingIncrement(8)};
`

const CloseTrade: React.FC = () => (
  <Wrapper>
    <PositionSlideUp />
  </Wrapper>
)

export default CloseTrade
