import { spacingIncrement } from 'prepo-ui'
import styled from 'styled-components'
import PositionsSlideUp from './PositionsSlideUp'

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${spacingIncrement(16)};
  min-height: ${spacingIncrement(324)};
  padding: ${spacingIncrement(8)};
  width: 100%;
`

const CloseTrade: React.FC = () => (
  <Wrapper>
    <PositionsSlideUp />
    <p>TODO: Input</p>
    <p>TODO: Button</p>
    <p>TODO: Summary</p>
  </Wrapper>
)

export default CloseTrade
