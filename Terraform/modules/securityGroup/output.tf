# Output for EC2 Security Group
output "ec2_sg_id" {
  description = "Security Group ID for EC2 instances"
  value       = aws_security_group.ec2_sg.id
}

# Output for ALB Security Group
output "alb_sg_id" {
  description = "Security Group ID for Application Load Balancer"
  value       = aws_security_group.alb_sg.id
}

# Output for EKS Security Group
output "eks_sg_id" {
  description = "Security Group ID for EKS cluster nodes"
  value       = aws_security_group.eks_sg.id
}
